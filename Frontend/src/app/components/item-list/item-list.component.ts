import { Component, Input, OnInit } from '@angular/core';
import { ItemService } from 'src/app/services/item.service';
import {
  trigger,
  state,
  style,
  transition,
  animate,
} from '@angular/animations';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { UserService } from 'src/app/services/user.service';
import { Subscription, switchMap } from 'rxjs';
import { updateBalanceDTO } from 'src/app/models/DTOs/updateBalance.dto';

@Component({
  selector: 'app-items-list',
  templateUrl: './item-list.component.html',
  styleUrls: ['./item-list.component.css'],
  animations: [
    trigger('fadeInOut', [
      state(
        'void',
        style({
          opacity: 0,
        })
      ),
      transition('void <=> *', animate(200)),
    ]),
  ],
})
export class ItemListComponent implements OnInit {
  @Input() items: any[] = [];
  private subscription: Subscription = new Subscription();
  protected selectedItem: any = null; // This will hold the currently selected item
  private userId: number | null = null;
  private userBalance = 0;
  protected deleteConfirm: boolean = false;

  constructor(
    private itemService: ItemService,
    private userService: UserService,
    private router: Router,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.itemService.getAllItems().subscribe((data: any) => {
      this.items = data;
    });
    this.userId = this.getUserId();
    this.getBalance();
  }

  expandItem(item: any) {
    this.selectedItem = item;
  }

  closeItemDetail() {
    this.selectedItem = null;
  }

  onImageError(event: any): void {
    event.target.src = 'assets/image-not-found.png';
  }

  formatPrice(price: number): string {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' Ft';
  }

  isUserTheOwner(): boolean {
    return this.selectedItem.userId === this.userId;
  }

  buyItem(): void {
    this.userId = this.getUserId();
    if (!this.userId) {
      this.router.navigate(['/login']);
      this.toastr.warning('You need to be logged in to buy items!');
      return;
    }
  
    this.getBalance();
  
    if (this.selectedItem.price > this.userBalance) {
      this.toastr.warning("You don't have enough money on your account!");
      return;
    }
  
    const updateBalance: updateBalanceDTO = {
      UserId: this.userId,
      Amount: -this.selectedItem.price,
    };
  
    this.userService.updateBalance(updateBalance).pipe(
      switchMap(() => this.itemService.buyItem(this.selectedItem.id))
    ).subscribe(
      (response: any) => {
        location.reload();
        this.toastr.success(`Successfully purchased ${this.selectedItem.name}!`);
        // Update component state or use Angular's change detection here
      },
      (error: any) => {
        this.toastr.error('Purchase failed.');
        console.log(error);
      }
    );
  }
  

  getUserId(): number | null {
    const userData = localStorage.getItem('id');
    return userData ? Number(userData) : null;
  }

  getBalance(): void {
    this.subscription.add(
      this.userService.getBalance(Number(this.userId)).subscribe(
        (balance: number) => {
          this.userBalance = balance;
        },
        (error) => {
          console.error('Error fetching balance:', error);
        }
      )
    );
  }

  editItem(): void {
    // Implement the edit logic here
    console.log('Editing item:', this.selectedItem.name);
  }

  deleteItem(): void {
    // Implement the delete logic here
    console.log('Deleting item:', this.selectedItem.name);
  }
}
