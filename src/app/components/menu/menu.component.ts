import { Component, HostListener, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommandeService } from 'src/app/services/commande.service';
import { LocalStorageService } from 'src/app/services/local-storage.service';
import { NetworkService } from 'src/app/services/network.service';
import { NotificationService } from 'src/app/services/notification.service';
import { ParametreService } from 'src/app/services/parametre.service';
import { UserService } from 'src/app/services/user.service';
declare var $: any;

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss']
})
export class MenuComponent implements OnInit {

  userName: string = '';
  role: string = '';
  notifications: any;
  total_pending: number = 0;
  isLoading = true;
  error: string = ''; // Variable pour gérer les erreurs

  //Calculator variable
  result: string = '';

  firstRoleName: string | null = null; // Contiendra le premier nom de rôle

  constructor(public commandeService: CommandeService, public router: Router,
    public userService: UserService, public localStorageService: LocalStorageService,
    public parametreService: ParametreService, public notificationService: NotificationService,
    private networkService: NetworkService) { }

  ngOnInit() {
    this.getMaintenance();
    this.userService.getUserLoggin();
    this.userName = this.userService.name;
    this.getNotifications();
    this.refreshRoleAndPermissonsUser();
    // Vérifier si les rôles existent dans l'utilisateur
    if (this.userService.user.roles && this.userService.user.roles.length > 0) {
      // Extraire le nom du premier rôle
      this.firstRoleName = this.userService.user.roles[0].name;
    }
  }

  getConnexion() {
    this.networkService.currentStatus.subscribe(isOnline => {
      if (isOnline) {
        console.log('Connexion rétablie');
      } else {
        console.log('Pas de connexion');
      }
    });
  }

  refreshRoleAndPermissonsUser(): void {
    this.userService.refreshRoleAndPermissonsUser(this.userService.user.id).subscribe(data => {
      let resp: any = data;
      this.userService.user.permissions = resp.user.permissions;
      this.userService.setRoles(resp.user.roles);
    });
  }

  getMaintenance() {
    this.parametreService.getSetting().subscribe((data) => {
      let response: any = data;
      localStorage.removeItem('setting');
      localStorage.setItem('setting', this.userService.encrypt(JSON.stringify(response.setting)));
    });
  }

  toggleFullscreen() {
    let elem: any = document.documentElement;
    if (!document.fullscreenElement && !(document as any).mozFullScreenElement &&
      !(document as any).webkitFullscreenElement && !(document as any).msFullscreenElement) {

      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
      } else if (elem.mozRequestFullScreen) {
        elem.mozRequestFullScreen();
      }
    } else {

      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        (document as any).mozCancelFullScreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      }
    }
  }


  /*++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
   * +++++++++++++++++++++ Notification ++++++++++++++++++++++++++++
  /+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++*/
  getNotifications() {
    // Récupérer les notifications au démarrage
    this.isLoading = true; // Indiquer que les données sont en cours de chargement
    this.notificationService.getNotifications().subscribe(
      (data) => {
        this.total_pending = data.total_pending ?? 0;
        this.notifications = data.notifications ?? [];
        this.isLoading = false; // Indiquer que les données ont été chargées 
      },
      (error) => {
        console.error('Erreur lors de la récupération des notifications :', error);
        this.isLoading = false;
      }
    );
  }

  all() {
    this.router.navigate(['/notifications']);
  }

  onNotificationClick(notification: any): void {
    // Marquer la notification comme envoyée
    this.notificationService.markAsSent(notification.id).subscribe((res) => {
      let data: any = res;
      // Passer l'id de la commande à la méthode detail
      this.getNotifications();
      this.router.navigate(['/accueil']);
      this.commandeService.detail(data.order);
    });
  }

  /*++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
   * +++++++++++++++++++++ Start Calculator ++++++++++++++++++++++++
  /+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++*/
  append(value: string): void {
    this.result += value;
  }

  clearAll(): void {
    this.result = '';
  }

  clearEntry(): void {
    this.result = this.result.slice(0, -1);
  }

  calculate(): void {
    try {
      // Attention : eval() peut être dangereux en production
      this.result = eval(this.result).toString();
    } catch (e) {
      this.result = 'Erreur';
    }
  }

  logout() {
    this.userService.logout();
  }
}