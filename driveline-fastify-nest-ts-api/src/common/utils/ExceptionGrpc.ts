import { RpcException } from '@nestjs/microservices';
import { throwError } from 'rxjs';

export function exceptionForMicroservice(error: { code?: number; details?: string; message?: string } & Error) {
  if (error && typeof error.code === 'number') {
    const newError = new RpcException({
      message: error.details || error.message,
      code: error.code,
    });
    return throwError(() => newError);
  }
  return throwError(() => error as Error);
}
/*
export declare class NotFoundException extends Error {
  constructor(error: string | object) {
    super(typeof error === 'string' ? error : JSON.stringify(error));
    this.name = 'NotFoundException';


      throw new RpcException({
          code: status.FAILED_PRECONDITION,
          message: 'Insufficient balance',
      });

  }
}*/
