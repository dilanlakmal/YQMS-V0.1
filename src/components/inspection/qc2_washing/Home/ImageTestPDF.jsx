import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image
} from '@react-pdf/renderer';
import { Image as PDFImage } from '@react-pdf/image';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 30,
  },
  section: {
    margin: 10,
    padding: 10,
    flexGrow: 1
  },
  title: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 20,
  },
  imageContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  image: {
    width: 200,
    height: 150,
    objectFit: 'cover',
  },
  imageLabel: {
    fontSize: 12,
    marginBottom: 10,
    textAlign: 'center',
  }
});

// Test component to verify image integration
const ImageTestPDF = ({ testImages = [] }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.title}>Image Integration Test</Text>
          
          {testImages.length > 0 ? (
            testImages.map((imageData, index) => (
              <View key={index} style={styles.imageContainer}>
                <Text style={styles.imageLabel}>
                  Test Image {index + 1}: {imageData.name || 'Unknown'}
                </Text>
                
                {/* Try PDFImage first */}
                {imageData.src && (
                  <View>
                    <Text style={{ fontSize: 10, marginBottom: 5 }}>Using @react-pdf/image:</Text>
                    <PDFImage
                      src={imageData.src}
                      style={styles.image}
                      cache={false}
                    />
                  </View>
                )}
                
                {/* Fallback to regular Image */}
                {imageData.src && (
                  <View style={{ marginTop: 10 }}>
                    <Text style={{ fontSize: 10, marginBottom: 5 }}>Using regular Image:</Text>
                    <Image
                      src={imageData.src}
                      style={styles.image}
                    />
                  </View>
                )}
              </View>
            ))
          ) : (
            <View style={styles.imageContainer}>
              <Text style={styles.imageLabel}>No test images provided</Text>
              <Text style={{ fontSize: 10, textAlign: 'center' }}>
                This is a test document to verify @react-pdf/image integration
              </Text>
            </View>
          )}
        </View>
      </Page>
    </Document>
  );
};

export default ImageTestPDF;