import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular';

@Component({
  selector: 'app-afterpay',
  templateUrl: './afterpay.page.html',
  styleUrls: ['./afterpay.page.scss'],
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class AfterpayPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
