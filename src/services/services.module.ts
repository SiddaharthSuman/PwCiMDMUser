import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { HttpClientModule } from "@angular/common/http";
import { RegistrationService } from "./registration-service/registration.service";
import { ReservationService } from "./reservation-service/reservation.service";

@NgModule({
    imports:[CommonModule, HttpClientModule],
    declarations: [],
    providers: [
        RegistrationService,
        ReservationService
    ]
})
export class ServicesModule {

}