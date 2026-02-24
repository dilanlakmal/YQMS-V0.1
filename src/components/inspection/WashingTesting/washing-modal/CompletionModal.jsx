import React from "react";
import ImageUploadModal from "./ImageUploadModal";
import { useModalStore } from "../../../../stores/washing/index.js";

const CompletionModal = ({
  isOpen,
  onClose,
  completionImages,
  setCompletionImages,
  completionNotes,
  setCompletionNotes,
  completionImageInputRef,
  handleCompletionImageUpload,
  handleCompletionSubmit,
  completionImageRotations,
  setCompletionImageRotations,
}) => {
  const { isSavingCompletion } = useModalStore();
  return (
    <ImageUploadModal
      isOpen={isOpen}
      onClose={onClose}
      images={completionImages}
      setImages={setCompletionImages}
      notes={completionNotes}
      setNotes={setCompletionNotes}
      captureInputRef={completionImageInputRef}
      onUpload={handleCompletionImageUpload}
      onSubmit={handleCompletionSubmit}
      isSaving={isSavingCompletion}
      imageRotations={completionImageRotations}
      setImageRotations={setCompletionImageRotations}
      title="Complete Report"
      description="Please upload images and add notes to complete this report."
      imageLabel="Completion Images"
      notesPlaceholder="Enter completion notes..."
      submitLabel="Complete Report"
      savingLabel="Completing..."
      submitColor="green"
      submitIcon="check"
    />
  );
};

export default CompletionModal;
