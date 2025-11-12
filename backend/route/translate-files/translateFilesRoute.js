import { NextResponse } from "next/server"
import { writeFile, rm, mkdir as fsMkdir } from "fs/promises"
import path from "path"
import os from "os"
import { randomUUID } from "crypto"

export async function POST(req) {
  let uploadDir = ""

  try {
    const formData = await req.formData()
    const files = formData.getAll("files")
    const targetLanguage = formData.get("targetLanguage")

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 })
    }

    if (!targetLanguage) {
      return NextResponse.json({ error: "Target language is required" }, { status: 400 })
    }

    // Create temporary directory for processing
    uploadDir = path.join(os.tmpdir(), `translator-${randomUUID()}`)
    await fsMkdir(uploadDir, { recursive: true })

    const azureApiKey = process.env.AZURE_TRANSLATOR_KEY
    const azureEndpoint = process.env.AZURE_TRANSLATOR_ENDPOINT

    if (azureApiKey && azureEndpoint) {
      // Use Azure Document Translation API
      return await translateWithAzure(files, targetLanguage, uploadDir, azureApiKey, azureEndpoint)
    } else {
      // Fallback: demo response
      return await translateWithDemo(files, targetLanguage, uploadDir)
    }
  } catch (error) {
    console.error("File translation error:", error)
    return NextResponse.json({ error: "File translation failed", details: String(error) }, { status: 500 })
  } finally {
    // Cleanup temp files
    if (uploadDir) {
      try {
        await rm(uploadDir, { recursive: true, force: true })
      } catch (e) {
        console.error("Cleanup error:", e)
      }
    }
  }
}

async function translateWithAzure(files, targetLanguage, uploadDir, apiKey, endpoint) {
  const processedFiles = []

  for (const file of files) {
    const filePath = path.join(uploadDir, file.name)
    const buffer = await file.arrayBuffer()
    await writeFile(filePath, Buffer.from(buffer))

    // Call Azure Document Translation API
    try {
      const translatedContent = await callAzureDocumentTranslation(
        Buffer.from(buffer),
        file.type,
        targetLanguage,
        apiKey,
        endpoint,
      )

      const translatedFileName = `translated_${file.name}`
      const translatedFilePath = path.join(uploadDir, translatedFileName)
      await writeFile(translatedFilePath, translatedContent)

      processedFiles.push({
        original: file.name,
        translated: translatedFileName,
        path: translatedFilePath,
      })
    } catch (err) {
      console.error(`Failed to translate ${file.name}:`, err)
    }
  }

  if (processedFiles.length === 0) {
    return NextResponse.json({ error: "No files were successfully translated" }, { status: 500 })
  }

  // Return first translated file
  const { readFile } = await import("fs/promises")
  const fileBuffer = await readFile(processedFiles[0].path)

  return new NextResponse(fileBuffer, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${processedFiles[0].translated}"`,
    },
  })
}

async function translateWithDemo(files, targetLanguage, uploadDir) {
  const translatedFileName = `translated_${files[0].name}`
  const translatedFilePath = path.join(uploadDir, translatedFileName)

  const buffer = await files[0].arrayBuffer()
  await writeFile(translatedFilePath, Buffer.from(buffer))

  const { readFile } = await import("fs/promises")
  const fileBuffer = await readFile(translatedFilePath)

  return new NextResponse(fileBuffer, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${translatedFileName}"`,
    },
  })
}

async function callAzureDocumentTranslation(fileBuffer, fileType, targetLanguage, apiKey, endpoint) {
  // Azure Document Translation endpoint
  const url = `${endpoint}/translator/document:translate?api-version=2024-05-01&targetLanguage=${targetLanguage}`

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Ocp-Apim-Subscription-Key": apiKey,
      "Ocp-Apim-Subscription-Region": process.env.AZURE_TRANSLATOR_REGION || "global",
      "Content-Type": fileType || "application/octet-stream",
    },
    body: fileBuffer,
  })

  if (!response.ok) {
    throw new Error(`Azure API error: ${response.statusText}`)
  }

  return Buffer.from(await response.arrayBuffer())
}
