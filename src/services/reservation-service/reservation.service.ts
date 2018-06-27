import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { ReservationModel } from "../../models/reservation.model";
import { ReservationRequestModel } from "../../models/reservation-request.model";
import { Device } from "../../models/device.model";

@Injectable()
export class ReservationService {

    private readonly ERROR_CODE_TOO_OLD = 'This code is too old!';
    private readonly ERROR_NO_SUCH_DEVICE = 'There is no such device!';

    private readonly METHOD_GET_ACTIVE_RESERVATIONS = 'getActiveReservations';
    private readonly METHOD_RESERVE_DEVICE = 'reserveDevice';
    private readonly METHOD_RELEASE_DEVICE = 'releaseDevice';
    private readonly METHOD_GET_DEVICE_BY_TABLE_ID = 'getDeviceByTableId';

    reservationURL = 'https://pwcimdm-server.000webhostapp.com/admin/reservation.php';
    adminURL = 'https://pwcimdm-server.000webhostapp.com/admin/admin.php';

    constructor(private http: HttpClient) { }

    checkActiveReservations(deviceId: string): Promise<ReservationModel[]> {
        const body = { 'method': this.METHOD_GET_ACTIVE_RESERVATIONS, 'data': { 'deviceId': deviceId } };
        return this.http.post<ReservationModel[]>(this.reservationURL, JSON.stringify(body)).toPromise();
    }

    reserveDeviceForUser(reservationDetails: ReservationRequestModel): Promise<string> {
        const body = { 'method': this.METHOD_RESERVE_DEVICE, 'data': { 'reservation': reservationDetails } };
        return this.http.post(this.reservationURL, JSON.stringify(body), { responseType: 'text' }).toPromise();
    }

    releaseDevice(reservation: ReservationModel) {
        const body = { 'method': this.METHOD_RELEASE_DEVICE, 'data': { 'reservation': reservation } };
        return this.http.post(this.reservationURL, JSON.stringify(body), { responseType: 'text' }).toPromise();
    }

    async getDeviceByTableId(id: number): Promise<Device> {
        const body = { 'method': this.METHOD_GET_DEVICE_BY_TABLE_ID, 'data': { 'id': id } };
        const deviceData = await this.http.post(this.adminURL, JSON.stringify(body), { responseType: 'text' }).toPromise().then(response => {
            if (response === this.ERROR_NO_SUCH_DEVICE) {
                return Promise.reject(this.ERROR_NO_SUCH_DEVICE);
            } else {
                return Promise.resolve(<Device>JSON.parse(response));
            }
        });
        return deviceData;
    }
}