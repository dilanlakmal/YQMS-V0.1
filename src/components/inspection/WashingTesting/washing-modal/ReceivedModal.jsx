import React from "react";
import ImageUploadModal from "./ImageUploadModal";
import { useModalStore } from "../stores";

const ReceivedModal = ({
  isOpen,
  onClose,
  receivedImages,
  setReceivedImages,
  receivedNotes,
  setReceivedNotes,
  receivedImageInputRef,
  handleReceivedImageUpload,
  handleReceivedSubmit,
  receivedImageRotations,
  setReceivedImageRotations,
}) => {
  const { isSavingReceived } = useModalStore();
  return (
    <ImageUploadModal
      isOpen={isOpen}
      onClose={onClose}
      images={receivedImages}
      setImages={setReceivedImages}
      notes={receivedNotes}
      setNotes={setReceivedNotes}
      captureInputRef={receivedImageInputRef}
      onUpload={handleReceivedImageUpload}
      onSubmit={handleReceivedSubmit}
      isSaving={isSavingReceived}
      imageRotations={receivedImageRotations}
      setImageRotations={setReceivedImageRotations}
      title="Received Report"
      description="Please upload images and add notes for this received report."
      imageLabel="Received Images"
      notesPlaceholder="Enter received notes..."
      submitLabel="Save Received"
      savingLabel="Saving..."
      submitColor="yellow"
      submitIcon="save"
    />
  );
};

export default ReceivedModal;
