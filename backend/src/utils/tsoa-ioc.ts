// filepath: /Users/m3hdi/Discura/backend/src/utils/tsoa-ioc.ts
import { logger } from './logger';
import * as backendControllers from '../controllers';
import { IocContainer } from 'tsoa';

/**
 * Map to store instantiated backend controller implementations
 */
const controllerInstances: Record<string, any> = {};

/**
 * TSOA IOC Container implementation for dependency injection.
 * 
 * This is referenced by TSOA during code generation via the "iocModule" setting in common/tsoa.json.
 * It ensures that TSOA uses our backend controller implementations instead of
 * the placeholder implementations in the common package.
 */
export const iocContainer: IocContainer = {
  get(controllerClass: { new(...args: any[]): any }): any {
    const className = controllerClass.name;
    
    // If we already have an instance, return it
    if (controllerInstances[className]) {
      return controllerInstances[className];
    }
    
    // Check if we have a backend implementation for this controller
    const BackendControllerClass = Object.values(backendControllers).find(
      (ctrl: any) => ctrl.name === className
    ) as any;
    
    if (BackendControllerClass) {
      // Create an instance of our backend implementation
      controllerInstances[className] = new BackendControllerClass();
      logger.info(`TSOA IOC: Created instance of ${className} from backend implementation`);
      return controllerInstances[className];
    }
    
    // Fallback to creating an instance of the original controller
    logger.warn(`TSOA IOC: No backend implementation found for ${className}, using common implementation`);
    controllerInstances[className] = new controllerClass();
    return controllerInstances[className];
  }
};