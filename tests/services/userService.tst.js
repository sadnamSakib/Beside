// tests/services/userService.test.js
import { userService } from "../../src/services/userService.js";
import { User } from "../../src/models/userModel.js";
import { AppError } from "../../src/utils/AppError.js";
import * as passwordHashUtil from "../../src/utils/passwordHash.js";

// Mock dependencies
jest.mock("../../src/models/userModel.js");
jest.mock("../../src/utils/passwordHash.js");

describe("User Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createUser", () => {
    it("should create a new user successfully", async () => {
      // Mock data
      const userData = {
        userName: "testuser",
        email: "test@example.com",
        password: "password123",
        mobileNo: "1234567890",
      };

      const hashedPassword = "hashedPassword123";
      const createdUser = {
        ...userData,
        password: hashedPassword,
        _id: "user123",
      };

      // Setup mocks
      User.findOne.mockResolvedValue(null);
      passwordHashUtil.passwordHash.mockResolvedValue(hashedPassword);
      User.create.mockResolvedValue(createdUser);

      // Execute
      const result = await userService.createUser(userData);

      // Assert
      expect(User.findOne).toHaveBeenCalledWith({
        $or: [{ email: userData.email }, { userName: userData.userName }],
      });
      expect(passwordHashUtil.passwordHash).toHaveBeenCalledWith(
        userData.password
      );
      expect(User.create).toHaveBeenCalledWith({
        ...userData,
        password: hashedPassword,
        role: "User",
      });
      expect(result).toEqual(createdUser);
    });

    it("should throw an error if user already exists", async () => {
      // Mock data
      const userData = {
        userName: "existinguser",
        email: "existing@example.com",
        password: "password123",
        mobileNo: "1234567890",
      };

      // Setup mocks
      User.findOne.mockResolvedValue({ _id: "existingId" });

      // Execute & Assert
      await expect(userService.createUser(userData)).rejects.toThrow(
        new AppError("User with this email or username already exists", 400)
      );
      expect(User.findOne).toHaveBeenCalledWith({
        $or: [{ email: userData.email }, { userName: userData.userName }],
      });
      expect(passwordHashUtil.passwordHash).not.toHaveBeenCalled();
      expect(User.create).not.toHaveBeenCalled();
    });
  });

  describe("getUserById", () => {
    it("should return user by ID", async () => {
      // Mock data
      const userId = "user123";
      const user = {
        _id: userId,
        userName: "testuser",
        email: "test@example.com",
      };

      // Setup mocks
      User.findById.mockResolvedValue(user);

      // Execute
      const result = await userService.getUserById(userId);

      // Assert
      expect(User.findById).toHaveBeenCalledWith(userId);
      expect(result).toEqual(user);
    });

    it("should throw an error if user not found", async () => {
      // Mock data
      const userId = "nonexistentId";

      // Setup mocks
      User.findById.mockResolvedValue(null);

      // Execute & Assert
      await expect(userService.getUserById(userId)).rejects.toThrow(
        new AppError("User not found", 404)
      );
      expect(User.findById).toHaveBeenCalledWith(userId);
    });
  });

  // Add more test cases for other methods
});
