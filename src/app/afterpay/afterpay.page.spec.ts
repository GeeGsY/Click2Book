import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AfterpayPage } from './afterpay.page';

describe('AfterpayPage', () => {
  let component: AfterpayPage;
  let fixture: ComponentFixture<AfterpayPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AfterpayPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
