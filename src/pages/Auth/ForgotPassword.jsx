import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import AuthLayout from "../../components/layout/AuthLayout";
import Button from "../../components/layout/Button";
import FormInput from "../../components/layout/FormInput";
import { text } from "body-parser";

const ForgotPassword = () => {
  const [empId, setEmpId] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [conPassword, setConPassword] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  return (
    <AuthLayout
      title="Forgot Password?"
      subtitle="You can create new password hear. Please follow the instruction."
    >
      <a href="/" className="flex items-center text-gray-600 mb-8">
        <ArrowLeft className="h-5 w-5 mr-2" />
        Back to Login
      </a>

      {!isSubmitted ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <FormInput
            label="Employee Id"
            id="emp_id"
            name="emp_id"
            type="text"
            required
            placeholder="Enter your Employee Id"
            value={empId}
            onChange={(e) => setEmpId(e.target.value)}
          />
          <FormInput
            label="New Password"
            id="password"
            name="password"
            type="password"
            required
            placeholder="Enter your new password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <FormInput
          label="Re-enter your password "
          id="confirm_password"
          name="confirm_password"
          type="password"
          required
          placeholder="Re-enter your new password"
          value={conPassword}
          onChange={(e) => setConPassword(e.target.value)}
        />


          <Button type="submit">Reset</Button>
        </form>
      ) : (
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
              <svg
                className="h-8 w-8 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Reseat Successful
          </h2>
          <p className="text-gray-600 mb-6">
           Successfully Reset Your password. Now you can login using new password.
          </p>
          <Link
            to="/"
            className="text-blue-600 hover:text-blue-500 font-medium"
          >
            Back to Login
          </Link>
        </div>
      )}
    </AuthLayout>
  );
};
export default ForgotPassword;
