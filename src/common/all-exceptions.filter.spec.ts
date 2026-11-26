import { AllExceptionsFilter } from './all-exceptions.filter';
import { HttpException, HttpStatus, ArgumentsHost } from '@nestjs/common';

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;

  beforeEach(() => {
    filter = new AllExceptionsFilter();
  });

  const createMockHost = () => {
    const jsonMock = jest.fn();
    const statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    const response = { status: statusMock };
    const request = { url: '/api/test' };

    const host = {
      switchToHttp: () => ({
        getResponse: () => response,
        getRequest: () => request,
      }),
    } as unknown as ArgumentsHost;

    return { host, response, jsonMock, statusMock };
  };

  it('should format standard HttpException properly', () => {
    const { host, statusMock, jsonMock } = createMockHost();
    const exception = new HttpException('Pesan error standar', HttpStatus.BAD_REQUEST);

    filter.catch(exception, host);

    expect(statusMock).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Pesan error standar',
        path: '/api/test',
      })
    );
  });

  it('should scrub and sanitize unexpected internal errors', () => {
    const { host, statusMock, jsonMock } = createMockHost();
    const internalErr = new Error('Database password leak: C:\\laragon\\www\\secret.ts');

    filter.catch(internalErr, host);

    expect(statusMock).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Terjadi kesalahan internal pada server',
        path: '/api/test',
      })
    );
  });
});
