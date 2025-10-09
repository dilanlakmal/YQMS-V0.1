import { Construction } from "lucide-react";
import React from "react";

const PlaceholderUploader = ({ buyer }) => {
  return (
    <div className="text-center py-20">
      <Construction className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-2 text-sm font-medium text-gray-900">
        {buyer} Uploader
      </h3>
      <p className="mt-1 text-sm text-gray-500">
        This feature is currently under construction.
      </p>
    </div>
  );
};

export default PlaceholderUploader;
