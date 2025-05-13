/**
 * TSOA Controller Injection Mechanism
 *
 * This file implements a runtime prototype patching solution that enables
 * backend-specific implementations of TSOA controllers that are defined
 * in the common package.
 *
 * How it works:
 * 1. For each controller in the backend, find the matching controller in common
 * 2. Create an instance of the backend controller
 * 3. Replace each method in the common controller's prototype with the backend implementation
 * 4. Each method is bound to its backend instance to preserve "this" context
 * 5. Optionally patch constructors as an additional safeguard
 *
 * This approach allows TSOA-generated routes from the common package to
 * execute backend implementations without modifying generated code.
 */

import * as commonControllers from "@discura/common/controllers";

import { logger } from "./logger";
import * as backendControllers from "../controllers";

/**
 * Map of controller instances by controller name
 * This maintains references to backend controller instances to:
 * 1. Prevent garbage collection during the application lifecycle
 * 2. Enable method binding to maintain correct "this" context
 * 3. Allow lookup by name for constructor patching
 */
const controllerInstances = new Map<string, any>();

/**
 * Injects backend controller implementations into common controller prototypes
 *
 * This is the primary function that performs the controller injection by:
 * - Finding all backend controllers that match common controllers
 * - Creating instances of backend controllers
 * - Patching common controller prototype methods with backend implementations
 * - Ensuring proper "this" binding for all methods
 *
 * Must be called BEFORE RegisterRoutes(app) in backend/src/index.ts
 */
export function injectBackendControllers(): void {
  try {
    // Step 1: Create instances of backend controllers and patch methods
    Object.values(backendControllers).forEach((ControllerClass: any) => {
      // Only process classes that are controllers (by naming convention)
      if (
        typeof ControllerClass === "function" &&
        ControllerClass.name.endsWith("Controller")
      ) {
        // Find the corresponding controller in the common package
        const commonControllerClass = Object.values(commonControllers).find(
          (ctrl: any) => ctrl.name === ControllerClass.name,
        ) as any;

        if (commonControllerClass) {
          logger.info(
            `Found backend implementation for: ${ControllerClass.name}`,
          );

          // Create an instance of the backend controller
          const backendInstance = new ControllerClass();
          controllerInstances.set(ControllerClass.name, backendInstance);

          // Get all methods from the backend controller prototype
          // except constructor, as we don't want to patch that yet
          const protoMethods = Object.getOwnPropertyNames(
            ControllerClass.prototype,
          ).filter(
            (name) =>
              name !== "constructor" &&
              typeof backendInstance[name] === "function",
          );

          // Directly replace the methods on the common controller prototype
          // This is the key step - TSOA routes will call these methods which now point to backend implementations
          protoMethods.forEach((methodName) => {
            logger.debug(`Patching ${ControllerClass.name}.${methodName}`);
            // Bind the method to the backend instance to ensure "this" context is preserved
            commonControllerClass.prototype[methodName] =
              backendInstance[methodName].bind(backendInstance);
          });

          logger.info(
            `Successfully injected backend implementation for ${ControllerClass.name}`,
          );
        } else {
          // This might happen if a backend controller doesn't have a corresponding common controller
          logger.warn(
            `No common controller found for backend controller: ${ControllerClass.name}`,
          );
        }
      }
    });

    // Step 2: Additional safeguard - Override constructors in common controllers
    // This handles the case where a new instance is created after our patching
    Object.values(commonControllers).forEach((CommonControllerClass: any) => {
      if (
        typeof CommonControllerClass === "function" &&
        CommonControllerClass.name.endsWith("Controller")
      ) {
        // Find our corresponding backend controller instance
        const backendInstance = controllerInstances.get(
          CommonControllerClass.name,
        );

        if (backendInstance) {
          // Store the original constructor to restore it later
          const originalConstructor =
            CommonControllerClass.prototype.constructor;
          CommonControllerClass._originalConstructor = originalConstructor;

          // Replace constructor to return our backend instance
          CommonControllerClass.prototype.constructor = function () {
            return backendInstance;
          };
        }
      }
    });

    logger.info(
      `Successfully injected backend controller implementations via route proxy`,
    );
  } catch (error) {
    // Log detailed error information for debugging
    logger.error("Failed to inject backend controller implementations:", error);
    if (error instanceof Error && error.stack) {
      logger.debug("Stack trace:", error.stack);
    }

    // Re-throw to ensure the application knows about this critical error
    throw new Error(
      `Controller injection failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Restores the original controller constructors to clean up after TSOA route registration
 *
 * This is an optional cleanup step that:
 * 1. Restores original constructors to avoid memory leaks
 * 2. Helps maintain a clean state if routes are re-registered
 *
 * Should be called AFTER RegisterRoutes(app) in backend/src/index.ts
 */
export function restoreOriginalControllers(): void {
  try {
    // Restore original constructors to avoid memory leaks
    Object.values(commonControllers).forEach((CommonControllerClass: any) => {
      if (
        typeof CommonControllerClass === "function" &&
        CommonControllerClass.name.endsWith("Controller") &&
        CommonControllerClass._originalConstructor
      ) {
        // Restore original constructor
        CommonControllerClass.prototype.constructor =
          CommonControllerClass._originalConstructor;
        delete CommonControllerClass._originalConstructor;
      }
    });

    // Note: We intentionally don't clear controllerInstances here
    // because we need to keep the instances alive for the patched methods

    logger.info("Successfully restored original controller constructors");
  } catch (error) {
    logger.error("Failed to restore original controller constructors:", error);
    if (error instanceof Error && error.stack) {
      logger.debug("Stack trace:", error.stack);
    }
  }
}
