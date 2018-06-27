import { Component, OnDestroy } from '@angular/core';
import { NavController, ToastController, Platform, Loading, LoadingController } from 'ionic-angular';
import { RegistrationService } from '../../services/registration-service/registration.service';
import { HomePage } from '../home/home';
import { Device } from '@ionic-native/device';
import { Network } from '@ionic-native/network';
import { Subscription } from 'rxjs/Subscription';
import { ReservationService } from '../../services/reservation-service/reservation.service';
import { ReservationPage } from '../reservation/reservation';

/**
 * Generated class for the RegistrationPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@Component({
  selector: 'page-registration',
  templateUrl: 'registration.html',
})
export class RegistrationPage implements OnDestroy {

  private readonly RESPONSE_DEVICE_ACTIVE = 'This device is registered and is active';
  private readonly RESPONSE_DEVICE_REGISTERED_INACTIVE = 'This device is registered but is inactive';
  private readonly RESPONSE_DEVICE_UNREGISTERED = 'This device is not registered yet';

  isDeviceAdded = false;
  code: string;
  disconnectSubscription: Subscription;
  connectSubscription: Subscription;
  isNetworkUnavailable: boolean;
  progress: Loading;

  constructor(private navCtrl: NavController,
    private platform: Platform,
    private registrationService: RegistrationService,
    private reservationService: ReservationService,
    private toastCtrl: ToastController,
    private device: Device, private network: Network,
    private loadingCtrl: LoadingController) {
    this.platform.ready().then(() => {
      this.setupNetworkListener();
      if (this.network.type !== 'none') {
        this.checkIfAlreadyRegistered();
      } else {
        this.isNetworkUnavailable = true;
      }
    });
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad RegistrationPage');

  }

  setupNetworkListener() {
    this.disconnectSubscription = this.network.onDisconnect().subscribe(() => {
      this.isNetworkUnavailable = true;
      this.serveToast('Connection unavailable!');
      if (this.progress) this.progress.dismissAll();
    });


    // watch network for a connection
    this.connectSubscription = this.network.onConnect().subscribe(() => {
      this.checkIfAlreadyRegistered();
      this.isNetworkUnavailable = false;
      this.serveToast('Connection restored!');
      if (this.progress) this.progress.dismissAll();
    });
  }

  checkIfAlreadyRegistered() {
    this.progress = this.presentLoading();
    this.progress.present();

    this.registrationService.checkDeviceRegistrationStatus(this.device.uuid).then(response => {
      
      this.progress.dismiss();

      if (response === this.RESPONSE_DEVICE_ACTIVE) {
        // Check if already in reservation
        // Present this.progress for aesthetics
        this.progress = this.presentLoading();
        this.progress.present();
        this.reservationService.checkActiveReservations(this.device.uuid).then(response => {
          this.progress.dismiss();
          if(response.length > 0) {
            this.navCtrl.setRoot(ReservationPage);
          } else {
            this.navCtrl.setRoot(HomePage);
          }
        });
      } else if (response === this.RESPONSE_DEVICE_REGISTERED_INACTIVE) {
        this.isDeviceAdded = true;
        this.code = this.device.uuid;
      } else if (response === this.RESPONSE_DEVICE_UNREGISTERED) {
        this.isDeviceAdded = false;
      } else {
        // Error case
        this.serveToast('There was an unexpected error when retrieving device status. Contact the administrator.');
        console.log(response);
      }
    }, error => console.log(error));
  }

  registerUser(username: string) {
    console.log("username is", username);
    if (username.trim().length === 0) {
      this.serveToast('Username cannot be empty!');
    } else {
      // Send these details to the server
      console.log(this.device.uuid);
      console.log((window as any).device.name);
      console.log(this.device.platform);
      console.log(this.device.model);
      console.log(this.device.manufacturer);
      console.log(this.device.version);

      this.registrationService.registerDeviceAgainstUser(
        username,
        this.device.uuid,
        (window as any).device.name,
        this.device.model,
        this.device.manufacturer
      ).then(response => {
        this.isDeviceAdded = true;
        this.code = response;
      }, error => console.log(error));
    }
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
    // this.progress.present();
  }

  ngOnDestroy() {
    this.connectSubscription.unsubscribe();
    this.disconnectSubscription.unsubscribe();
  }

}
