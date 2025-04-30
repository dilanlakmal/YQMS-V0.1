import React from "react";
import { Text, View } from "@react-pdf/renderer";

const MeasurementPointCardPDF = ({ measurementPointSummary, styles }) => {
  return (
    <>
      <Text style={styles.subtitle}>Overall Measurement Point Summary</Text>
      <View style={styles.cardContainer}>
        {measurementPointSummary.length > 0 ? (
          measurementPointSummary.map((point, index) => {
            const isPass = parseFloat(point.passRate) > 98;
            return (
              <View key={index} style={styles.card}>
                <Text style={styles.cardTitle}>{point.measurementPoint}</Text>
                <View style={styles.cardContent}>
                  <Text>Total Count: {point.totalCount}</Text>
                  <Text>Total Pass: {point.totalPass}</Text>
                  <Text>Total Fail: {point.totalFail}</Text>
                  <Text>Pass Rate: {point.passRate}%</Text>
                </View>
                <Text
                  style={[
                    styles.cardFooter,
                    isPass ? styles.textGreen : styles.textRed
                  ]}
                >
                  Status: {point.status}
                </Text>
              </View>
            );
          })
        ) : (
          <Text>No measurement points available</Text>
        )}
      </View>
    </>
  );
};

export default MeasurementPointCardPDF;
