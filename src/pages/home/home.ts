import { Component, OnDestroy } from '@angular/core';
import { NavController, ToastController, Platform, Loading, LoadingController } from 'ionic-angular';
import { QRScanner, QRScannerStatus } from '@ionic-native/qr-scanner';
import { RegistrationService } from '../../services/registration-service/registration.service';
import { Network } from '@ionic-native/network';
import { Subscription } from 'rxjs/Subscription';
import { ReservationPage } from '../reservation/reservation';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html',
})
export class HomePage implements OnDestroy {
  isScanning = true;
  scanSub: Subscription;
  isNetworkUnavailable: boolean;
  disconnectSubscription: Subscription;
  connectSubscription: Subscription;
  progress: Loading;

  constructor(public platform: Platform,
    public navCtrl: NavController,
    private qrScanner: QRScanner,
    private toastCtrl: ToastController,
    private registrationService: RegistrationService,
    private network: Network,
    private loadingCtrl: LoadingController) {

    this.platform.ready().then(() => {
      this.setupNetworkListener();
      if (this.network.type !== 'none') {
        this.initQR();
      } else {
        this.isNetworkUnavailable = true;
      }
    });
  }

  setupNetworkListener() {
    this.disconnectSubscription = this.network.onDisconnect().subscribe(() => {
      // if data is not present, close scanner cuz it might be open
      // if data is present, unlikely because another page will be open in this case
      this.isNetworkUnavailable = true;
      this.presentToast('Connection unavailable!');
      this.scanSub.unsubscribe();
      this.qrScanner.hide();
      this.exit_from_qr_scan();
      if (this.progress) this.progress.dismissAll();
    });

    // watch network for a connection
    this.connectSubscription = this.network.onConnect().subscribe(() => {
      // if data is not present, open the scanner
      // if data is present, unlikely because another page will be open in this case
      this.isNetworkUnavailable = false;
      this.presentToast('Connection restored!');
      if (this.progress) this.progress.dismissAll();
      this.initQR();
    });
  }

  initQR() {
    // Optionally request the permission early
    this.qrScanner.prepare()
      .then((status: QRScannerStatus) => {
        if (status.authorized) {
          // camera permission was granted
          // start scanning
          this.scanSub = this.qrScanner.scan().subscribe((text: string) => {
            console.log('Scanned something', text);

            this.processScannedData(text);

            this.qrScanner.hide(); // hide camera preview

            this.scanSub.unsubscribe(); // stop scanning
            this.exit_from_qr_scan();
          });

          this.enterQRScan();
          this.qrScanner.show();

        } else if (status.denied) {
          // camera permission was permanently denied
          // you must use QRScanner.openSettings() method to guide the user to the settings page
          // then they can grant the permission from there
        } else {
          // permission was denied, but not permanently. You can ask for permission again at a later time.
        }
      })
      .catch((e: any) => console.log('Error is', e));
  }

  processScannedData(scan: string) {
    this.progress = this.presentLoading();
    this.progress.present();

    this.registrationService.analyseCode(scan).then(response => {
      console.log(response);
      console.log(JSON.stringify(response));
      this.progress.dismiss();
      this.navCtrl.setRoot(ReservationPage, { deviceData: response });
    }, error => this.presentToast('error in service: ' + error));
  }

  presentToast(text: string) {
    let toast = this.toastCtrl.create({
      message: text,
      duration: 3000,
      position: 'top'
    });

    toast.onDidDismiss(() => {
      console.log('Dismissed toast');
    });

    toast.present();
  }

  enterQRScan() {
    (window.document.querySelector('ion-app') as HTMLElement).classList.add('cameraView');
    this.isScanning = true;
  }

  exit_from_qr_scan() {
    this.isScanning = false;
    (window.document.querySelector('ion-app') as HTMLElement).classList.remove('cameraView');
    let content = <HTMLElement>document.getElementsByTagName("body")[0];
    content.style.background = "white !important";
    this.qrScanner.destroy().then(value => console.log('destroyed', value));
  }

  light_enable_disable() {

  }

  change_camera() {

  }

  presentLoading(): Loading {
    return this.loadingCtrl.create({
      content: "Please wait..."
    });
    // loader.present();
  }

  ngOnDestroy() {
    // stop disconnect watch
    this.disconnectSubscription.unsubscribe();
    // stop connect watch
    this.connectSubscription.unsubscribe();
  }
}
