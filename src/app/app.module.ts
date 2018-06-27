import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { Device } from '@ionic-native/device';
import { Network } from '@ionic-native/network';

import { MyApp } from './app.component';
import { HomePage } from '../pages/home/home';
import { ListPage } from '../pages/list/list';

import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';

import { QRScanner } from '@ionic-native/qr-scanner';
import { ServicesModule } from '../services/services.module';
import { RegistrationPage } from '../pages/registration/registration';
import { ReservationPage } from '../pages/reservation/reservation';
import { MomentModule } from 'ngx-moment';

@NgModule({
  declarations: [
    MyApp,
    HomePage,
    ListPage,
    RegistrationPage,
    ReservationPage
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(MyApp),
    ServicesModule,
    MomentModule
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    HomePage,
    ListPage,
    RegistrationPage,
    ReservationPage
  ],
  providers: [
    StatusBar,
    SplashScreen,
    { provide: ErrorHandler, useClass: IonicErrorHandler },
    QRScanner,
    Device,
    Network
  ]
})
export class AppModule { }
