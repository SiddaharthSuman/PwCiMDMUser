import { Component, OnDestroy } from '@angular/core';
import { NavController, NavParams, ToastController, LoadingController, Loading } from 'ionic-angular';
import { DeviceRegistrationModel } from '../../models/device-registration.model';
import { Network } from '@ionic-native/network';
import { Subscription } from 'rxjs/Subscription';
import { Device } from '@ionic-native/device';
import { ReservationService } from '../../services/reservation-service/reservation.service';
import * as moment from 'moment-timezone';
import { ReservationRequestModel } from '../../models/reservation-request.model';
import { ReservationModel } from '../../models/reservation.model';
import { Device as DeviceModel } from '../../models/device.model';

/**
 * Generated class for the ReservationPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@Component({
  selector: 'page-reservation',
  templateUrl: 'reservation.html',
})
export class ReservationPage implements OnDestroy {
  deviceInfo: DeviceRegistrationModel;
  disconnectSubscription: Subscription;
  connectSubscription: Subscription;
  isNetworkUnavailable: boolean;
  isAlreadyInReservation: boolean;
  endDateString: string;
  startDateString: string;
  isOverriding = false;
  undergoingReservation: boolean;
  reservation: ReservationModel;
  reservationStartDateString: string;
  reservationEndDateString: string;
  progress: Loading;
  deviceData: DeviceModel;
  isDeviceReleased: boolean;

  constructor(public navCtrl: NavController,
    public navParams: NavParams,
    private toastCtrl: ToastController,
    private network: Network,
    private device: Device, private loadingCtrl: LoadingController,
    private service: ReservationService) {
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad ReservationPage');
    this.setupNetworkListener();
    if (this.network.type !== 'none') {
      this.initReservation();
    } else {
      this.isNetworkUnavailable = true;
    }
  }

  setupNetworkListener() {
    this.disconnectSubscription = this.network.onDisconnect().subscribe(() => {
      this.isNetworkUnavailable = true;
      this.serveToast('Connection unavailable!');
      if (this.progress) this.progress.dismissAll();
    });


    // watch network for a connection
    this.connectSubscription = this.network.onConnect().subscribe(() => {
      this.initReservation();
      this.isNetworkUnavailable = false;
      this.serveToast('Connection restored!');
      if (this.progress) this.progress.dismissAll();
    });
  }

  initReservation() {
    this.deviceInfo = this.navParams.get('deviceData'); //Replace this line with something to run on browser
    // this.deviceInfo = JSON.parse('{"device":{"id":"2","deviceId":"A8A42B20-DF2E-48C4-9877-DDD43DC78562","deviceName":"PwC IPhone i7","deviceModel":"iPhone7,1","deviceManufacturer":"Apple","deviceSerial":"","verified":false,"dateAdded":"2018-05-28 14:35:17"},"date":"2018-06-21T05:38:35.000Z"}');
    this.progress = this.presentLoading();
    this.progress.present();
    if (!this.deviceInfo) {
      // Check if already in reservation
      this.service.checkActiveReservations(this.device.uuid).then(reservations => {
        if (reservations.length > 0) {
          this.reservation = reservations[0];
          this.service.getDeviceByTableId(this.reservation.device).then(deviceData => {
            this.deviceData = deviceData;
            this.progress.dismiss();
          });
          this.reservationStartDateString = moment(this.reservation.startTime).utcOffset(0, true).tz('Asia/Kolkata').format();
          this.reservationEndDateString = moment(this.reservation.endTime).utcOffset(0, true).tz('Asia/Kolkata').format();
          this.isAlreadyInReservation = true;
        }
      });
    } else {
      this.progress.dismiss();
      const startDateMoment = moment(this.deviceInfo.date);
      this.startDateString = startDateMoment.format();
      const endDate = startDateMoment.clone();
      this.endDateString = endDate.add(8, 'hours').format();
    }
  }

  overrideDate() {
    this.isOverriding = !this.isOverriding;
  }

  reserveDevice() {
    this.undergoingReservation = true;
    this.progress = this.presentLoading();
    this.progress.present();
    // Take all the data and reserve the device for the user
    const reservationData = new ReservationRequestModel();
    reservationData.device = this.deviceInfo.device.id;
    reservationData.user = this.device.uuid;
    reservationData.startTime = new Date(this.startDateString);
    reservationData.endTime = new Date(this.endDateString);
    this.service.reserveDeviceForUser(reservationData).then(response => {
      this.reservation = JSON.parse(response)[0];
      this.service.getDeviceByTableId(this.reservation.device).then(deviceData => {
        this.deviceData = deviceData;
        this.progress.dismiss();
      });
      this.reservationStartDateString = moment(this.reservation.startTime).utcOffset(0, true).tz('Asia/Kolkata').format();
      this.reservationEndDateString = moment(this.reservation.endTime).utcOffset(0, true).tz('Asia/Kolkata').format();
      console.log(response);
      this.isAlreadyInReservation = true;
      this.undergoingReservation = false;
    });
  }

  releaseDevice() {
    this.undergoingReservation = true;
    this.progress = this.presentLoading();
    this.progress.present();
    // Take all the data and reserve the device for the user
    this.service.releaseDevice(this.reservation).then(response => {
      this.undergoingReservation = false;
      this.progress.dismiss();
      this.isDeviceReleased = true;
    });
  }

  serveToast(text: string) {
    let toast = this.toastCtrl.create({
      message: text,
      duration: 3000,
      position: 'top'
    });
    toast.present();
  }

  presentLoading(): Loading {
    return this.loadingCtrl.create({
      content: "Please wait..."
    });
    // loader.present();
  }

  ngOnDestroy() {
    this.connectSubscription.unsubscribe();
    this.disconnectSubscription.unsubscribe();
  }

}
