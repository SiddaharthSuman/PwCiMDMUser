import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DecryptedData } from '../../models/decrypted-data.model';
import { DeviceRegistrationModel } from '../../models/device-registration.model';

@Injectable()
export class RegistrationService {

    private readonly ERROR_CODE_TOO_OLD = 'This code is too old!';
    private readonly ERROR_DEVICE_DOESNT_EXIST = 'Specified device does not exist!';
    private readonly ERROR_USERNAME_ALREADY_EXISTS = 'This username has already been taken!';
    private readonly ERROR_PROVIDE_ALL_DETAILS = 'Please provide all the neccessary details first!';
    private readonly ERROR_USERNAME_HAS_ILLEGAL_CHARACTERS = 'The username you have entered has illegal characters in it, please enter a valid username!';

    private readonly METHOD_GET_DEVICE_DETAILS = 'getDeviceDetails';
    private readonly METHOD_REGISTER_USER = 'registerUser';
    private readonly METHOD_DEVICE_REGISTRATION_STATUS = 'deviceRegistrationStatus';

    decryptorURL = 'https://pwcimdm-server.000webhostapp.com/decryptor.php';
    detailsURL = 'https://pwcimdm-server.000webhostapp.com/admin/admin.php';

    constructor(private http: HttpClient) { }

    private getDecryptedDataFromCode(code: string): Promise<DecryptedData> {
        const body = { 'cipher': code };
        return this.http.post(this.decryptorURL, JSON.stringify(body), { responseType: 'text' }).toPromise().then(response => {
            console.log('decrypted data', response);
            const values = response.split(' ');
            if (values.length === 3) {
                // Most probably we have correct data
                try {
                    const data = new DecryptedData();
                    data.deviceId = values[0];
                    const dateValues = values[1].split('-').map((dateData) => {
                        return parseInt(dateData);
                    });
                    const timeValues = values[2].split(':').map((dateData) => {
                        return parseInt(dateData);
                    });
                    data.date = new Date(dateValues[2], dateValues[1] - 1, dateValues[0], timeValues[0], timeValues[1], timeValues[2]);
                    return Promise.resolve(data);

                } catch {
                    return Promise.reject('There was an error in the code or from the server. Please contact the administrator.');
                }
            } else if (response === this.ERROR_CODE_TOO_OLD) {
                return Promise.reject('The QR code is too old! Please scan a fresh one.');
            }
        }, error => {
            console.log('getDecryptedDataFromCodeError', error);
            return Promise.reject('There was a possible network error. Please contact the administrator.');
        });
    }

    private getDeviceDetails(data: DecryptedData): Promise<DeviceRegistrationModel> {
        const body = { 'method': this.METHOD_GET_DEVICE_DETAILS, 'data': { 'deviceId': data.deviceId } };
        return this.http.post(this.detailsURL, JSON.stringify(body), { responseType: 'text' }).toPromise().then(response => {
            if (response === this.ERROR_DEVICE_DOESNT_EXIST) {
                return Promise.reject(this.ERROR_DEVICE_DOESNT_EXIST);
            } else {
                try {
                    const deviceDetails = new DeviceRegistrationModel();
                    deviceDetails.device = JSON.parse(response);
                    deviceDetails.date = data.date;
                    return Promise.resolve(deviceDetails);
                } catch {
                    return Promise.reject('getDeviceDetails => Some error occurred while converting response to JSON.' + response);
                }
            }
        }, error => {
            return Promise.reject(error);
        });
    }

    analyseCode(code: string): Promise<DeviceRegistrationModel> {
        return this.getDecryptedDataFromCode(code).then(value => {
            return this.getDeviceDetails(value);
        }, error => {
            console.log('getDeviceDetailsError', error);
            return Promise.reject(error);
        });
    }

    registerDeviceAgainstUser(
        username: string,
        uuid: string,
        name: string,
        model: string,
        manufacturer: string
    ): Promise<string> {
        const body = {
            'method': this.METHOD_REGISTER_USER, 'data': {
                'username': username,
                'uuid': uuid,
                'name': name,
                'model': model,
                'manufacturer': manufacturer
            }
        };
        return this.http.post(this.detailsURL, JSON.stringify(body), { responseType: 'text' }).toPromise().then(response => {
            if (response === this.ERROR_USERNAME_ALREADY_EXISTS) {
                return Promise.reject(this.ERROR_USERNAME_ALREADY_EXISTS);
            } else if (response === this.ERROR_USERNAME_HAS_ILLEGAL_CHARACTERS) {
                return Promise.reject(this.ERROR_USERNAME_HAS_ILLEGAL_CHARACTERS);
            } else if (response === this.ERROR_PROVIDE_ALL_DETAILS) {
                return Promise.reject(this.ERROR_PROVIDE_ALL_DETAILS);
            } else {
                try {
                    const registrationCodeJson = JSON.parse(response);
                    return Promise.resolve(registrationCodeJson['code']);
                } catch {
                    return Promise.reject('registerDeviceAgainstUser => Some error occurred while converting response to JSON.' + response);
                }
            }
        }, error => {
            return Promise.reject(error);
        });
    }

    checkDeviceRegistrationStatus(uuid: string): Promise<string> {
        const body = { 'method': this.METHOD_DEVICE_REGISTRATION_STATUS, 'data': { 'uuid': uuid } };

        return this.http.post(this.detailsURL, JSON.stringify(body), { responseType: 'text' }).toPromise();
    }
}