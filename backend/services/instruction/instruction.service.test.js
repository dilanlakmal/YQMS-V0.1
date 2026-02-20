import { jest } from '@jest/globals';

// Define mocks first
const mockDocument = {
    findById: jest.fn(),
    findOne: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findOneAndUpdate: jest.fn(),
    updateMany: jest.fn(),
    create: jest.fn()
};

const mockInstruction = {
    findById: jest.fn(),
    findOne: jest.fn(),
    getInstruction: jest.fn(),
    initialize: jest.fn()
};

const mockBlobStorage = {
    downloadBlob: jest.fn(),
    uploadBlob: jest.fn(),
    listBlobs: jest.fn(),
    deleteBlob: jest.fn(),
    deleteBlobsByPrefix: jest.fn(),
    ensureContainerExists: jest.fn()
};

const mockLLM = {
    LLMImageExtractor: jest.fn(),
    LLMOCR: jest.fn()
};

const mockAzureTranslator = {
    submitTranslationJob: jest.fn(),
    pollTranslationStatus: jest.fn(),
    getTranslatedContent: jest.fn(),
    getSupportedLanguages: jest.fn(),
    detectLanguage: jest.fn()
};

const mockTranslationModels = {
    Translation: { updateOne: jest.fn() },
    Content: { findOne: jest.fn(), createWithText: jest.fn(), updateOne: jest.fn() },
    Language: { findOne: jest.fn() }
};

const mockPdfPoppler = {
    convert: jest.fn()
};

const mockFs = {
    mkdtemp: jest.fn().mockResolvedValue('/tmp/dir'),
    writeFile: jest.fn().mockResolvedValue(),
    readdir: jest.fn().mockResolvedValue([]),
    readFile: jest.fn().mockResolvedValue(Buffer.from('')),
    rm: jest.fn().mockResolvedValue()
};

const mockCheerio = {
    load: jest.fn()
};

// Apply mocks using unstable_mockModule for ESM
jest.unstable_mockModule('../../models/instruction/index.js', () => ({
    Document: mockDocument,
    Instruction: mockInstruction
}));

jest.unstable_mockModule('../../storage/azure.blob.storage.js', () => mockBlobStorage);
jest.unstable_mockModule('../../controller/ai/extractor/ollama.extract.controller.js', () => mockLLM);
jest.unstable_mockModule('../../services/translation/azure.translator.service.js', () => ({ default: mockAzureTranslator }));
jest.unstable_mockModule('../../models/translation/index.js', () => mockTranslationModels);
jest.unstable_mockModule('pdf-poppler', () => ({
    default: {
        convert: mockPdfPoppler.convert
    }
}));

jest.unstable_mockModule('fs/promises', () => ({
    default: {
        mkdtemp: mockFs.mkdtemp,
        writeFile: mockFs.writeFile,
        readdir: mockFs.readdir,
        readFile: mockFs.readFile,
        rm: mockFs.rm
    }
}));

jest.unstable_mockModule('os', () => ({
    default: {
        tmpdir: () => '/tmp'
    }
}));

jest.unstable_mockModule('path', () => ({
    default: {
        parse: (p) => ({ name: p.split('/').pop().split('.').shift() }),
        join: (...args) => args.join('/'),
    }
}));

jest.unstable_mockModule('cheerio', () => ({
    load: mockCheerio.load
}));

// Now import the service
const { default: instructionService } = await import('./instruction.service.js');

describe('InstructionService', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getPageImageBase64', () => {
        it('should return base64 image on success', async () => {
            const docId = '66d579db35d05f2b0a0205c2';
            const pageNumber = 1;
            const imageUrl = 'http://localhost:10000/devstoreaccount1/container/image.jpg';
            const buffer = Buffer.from('test image content');

            mockDocument.findById.mockResolvedValue({
                imageExtracted: [imageUrl]
            });
            mockBlobStorage.downloadBlob.mockResolvedValue(buffer);

            const result = await instructionService.getPageImageBase64(docId, pageNumber);

            expect(result).toBe(buffer.toString('base64'));
            expect(mockDocument.findById).toHaveBeenCalledWith(docId);
            expect(mockBlobStorage.downloadBlob).toHaveBeenCalledWith('container', 'image.jpg');
        });

        it('should throw 404 if document not found', async () => {
            mockDocument.findById.mockResolvedValue(null);
            await expect(instructionService.getPageImageBase64('invalid', 1))
                .rejects.toEqual({ status: 404, message: "Document not found" });
        });

        it('should throw 404 if image for page not found', async () => {
            mockDocument.findById.mockResolvedValue({ imageExtracted: [] });
            await expect(instructionService.getPageImageBase64('doc123', 1))
                .rejects.toEqual({ status: 404, message: "Image for page 1 not found" });
        });
    });

    describe('getInstructionData', () => {
        it('should return populated instruction data on success', async () => {
            const docId = 'doc123';
            const mockInst = {
                _id: 'inst123',
                toObject: jest.fn().mockReturnValue({ _id: 'inst123', title: 'Test' }),
                getDetectedLanguage: jest.fn().mockResolvedValue('en')
            };

            mockInstruction.getInstruction.mockResolvedValue(mockInst);

            const result = await instructionService.getInstructionData(docId);

            expect(result.detectedLanguage).toBe('en');
            expect(result.title).toBe('Test');
            expect(mockInstruction.getInstruction).toHaveBeenCalledWith(docId);
        });

        it('should throw 404 if instruction not found', async () => {
            mockInstruction.getInstruction.mockResolvedValue(null);
            await expect(instructionService.getInstructionData('doc123'))
                .rejects.toEqual({ status: 404, message: "Instruction data not found for this document" });
        });
    });

    describe('extractTextFromImage', () => {
        it('should call LLMOCR and return text', async () => {
            const base64 = 'somebase64';
            mockLLM.LLMOCR.mockResolvedValue('Extracted Text');

            const result = await instructionService.extractTextFromImage(base64);

            expect(result).toBe('Extracted Text');
            expect(mockLLM.LLMOCR).toHaveBeenCalledWith(base64);
        });
    });

    describe('convertPdfToImage', () => {
        it('should return existing images if already processed', async () => {
            const userId = 'user123';
            const docId = 'doc123';
            const mockDoc = {
                _id: docId,
                source: 'http://localhost:10000/devstoreaccount1/container/source.pdf',
                status: 'imageExtracted',
                imageExtracted: ['img1.jpg']
            };

            mockDocument.findOne.mockResolvedValue(mockDoc);
            mockBlobStorage.listBlobs.mockResolvedValue([{ name: 'source/1.jpg' }]);

            const result = await instructionService.convertPdfToImage(userId, docId);

            expect(result.alreadyProcessed).toBe(true);
            expect(result.images).toEqual(['img1.jpg']);
            expect(mockBlobStorage.downloadBlob).not.toHaveBeenCalled();
        });

        it('should convert PDF and return new image URLs', async () => {
            const userId = 'user123';
            const docId = 'doc123';
            const mockDoc = {
                _id: docId,
                source: 'http://localhost:10000/devstoreaccount1/container/source.pdf',
                status: 'uploaded'
            };

            mockDocument.findOne.mockResolvedValue(mockDoc);
            mockBlobStorage.downloadBlob.mockResolvedValue(Buffer.from('pdf content'));
            mockFs.mkdtemp.mockResolvedValue('/tmp/pdf_conv_1');
            mockFs.readdir.mockResolvedValue(['page-1.jpg']);
            mockFs.readFile.mockResolvedValue(Buffer.from('image content'));
            mockBlobStorage.uploadBlob.mockResolvedValue('http://blob/img1.jpg');

            const result = await instructionService.convertPdfToImage(userId, docId);

            expect(result.images).toEqual(['http://blob/img1.jpg']);
            expect(mockPdfPoppler.convert).toHaveBeenCalled();
            expect(mockDocument.findByIdAndUpdate).toHaveBeenCalled();
        });
    });

    describe('extractFields', () => {
        it('should extract fields using LLM and update instruction', async () => {
            const userId = 'user123';
            const docId = 'doc123';
            const mockDoc = {
                _id: docId,
                status: 'imageExtracted',
                imageExtracted: ['http://localhost:10000/devstoreaccount1/container/page1.jpg']
            };
            const mockInst = {
                _id: 'inst123',
                getDynamicSchema: jest.fn().mockResolvedValue({}),
                updateInstruction: jest.fn().mockResolvedValue({ _id: 'inst123', getDetectedLanguage: () => 'en' }),
                getDetectedLanguage: jest.fn().mockResolvedValue('en')
            };

            mockDocument.findOne.mockResolvedValue(mockDoc);
            mockInstruction.findOne.mockResolvedValue(mockInst);
            mockBlobStorage.downloadBlob.mockResolvedValue(Buffer.from('image'));
            mockLLM.LLMImageExtractor.mockResolvedValue({ field1: 'value1' });
            mockInstruction.getInstruction.mockResolvedValue({ _id: 'inst123' });

            const result = await instructionService.extractFields(userId, docId, 1);

            expect(result.instructionId).toBe('inst123');
            expect(mockLLM.LLMImageExtractor).toHaveBeenCalled();
            expect(mockInst.updateInstruction).toHaveBeenCalledWith({ field1: 'value1' });
        });

        it('should throw 400 if document status is not imageExtracted', async () => {
            mockDocument.findOne.mockResolvedValue({ status: 'uploaded' });
            mockInstruction.findOne.mockResolvedValue({});

            await expect(instructionService.extractFields('u', 'd', 1))
                .rejects.toEqual({ status: 400, message: "Document is not ready for extraction (must be in 'imageExtracted' status)" });
        });
    });

    describe('translateStaticContent', () => {
        it('should return original if same as target language', async () => {
            const text = 'Hello';
            const toLang = 'en';
            const mockContent = {
                language: { code: 'en' }
            };

            mockTranslationModels.Content.findOne.mockReturnValue({
                populate: jest.fn().mockResolvedValue(mockContent)
            });

            // Re-mocking to handle the populate chain
            mockTranslationModels.Content.findOne.mockImplementation(() => ({
                populate: () => ({
                    language: { code: 'en' }
                })
            }));

            const result = await instructionService.translateStaticContent(text, toLang);
            expect(result.translated).toBe('Hello');
            expect(result.source).toBe('en');
        });

        it('should call translateText and return translated content', async () => {
            const text = 'Hello';
            const toLang = 'fr';
            const mockContent = {
                language: { code: 'en' },
                translateText: jest.fn().mockResolvedValue('Bonjour')
            };

            mockTranslationModels.Content.findOne.mockImplementation(() => ({
                populate: () => mockContent
            }));

            const result = await instructionService.translateStaticContent(text, toLang);
            expect(result.translated).toBe('Bonjour');
            expect(mockContent.translateText).toHaveBeenCalledWith('fr');
        });
    });
});
