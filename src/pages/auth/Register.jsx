import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import AuthLayout from "../../components/layout/AuthLayout";
import FormInput from "../../components/layout/FormInput";
import Button from "../../components/layout/Button";

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle registration logic here
  };

  return (
    <AuthLayout
      title="Create Account"
      subtitle="Join YQMS to manage your quality control processes"
    >
      <Link to="/" className="flex items-left text-gray-600 mb-8">
        <ArrowLeft className="h-5 w-5 mr-2" />
        Back to Login
      </Link>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <FormInput
            label="First Name"
            id="firstName"
            name="firstName"
            type="text"
            required
            placeholder="First Name"
            value={formData.firstName}
            onChange={handleChange}
          />
          <FormInput
            label="Last Name"
            id="lastName"
            name="lastName"
            type="text"
            required
            placeholder="Last Name"
            value={formData.lastName}
            onChange={handleChange}
          />
        </div>

        <FormInput
          label="Email Address"
          id="email"
          name="email"
          type="email"
          required
          placeholder="Enter your email"
          value={formData.email}
          onChange={handleChange}
        />

        <FormInput
          label="Password"
          id="password"
          name="password"
          type="password"
          required
          placeholder="Create a password"
          value={formData.password}
          onChange={handleChange}
        />

        <FormInput
          label="Confirm Password"
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          placeholder="Confirm your password"
          value={formData.confirmPassword}
          onChange={handleChange}
        />

        <Button type="submit">Create Account</Button>

        <p className="text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link to="/" className="font-medium text-blue-600 hover:text-blue-500">
            Log in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default Register;