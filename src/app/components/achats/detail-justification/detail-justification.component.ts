import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { CommandeService } from 'src/app/services/commande.service';
import { FournisseurService } from 'src/app/services/fournisseur.service';
import { ParametreService } from 'src/app/services/parametre.service';
import { UserService } from 'src/app/services/user.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-detail-justification',
  templateUrl: './detail-justification.component.html',
  styleUrls: ['./detail-justification.component.scss']
})
export class DetailJustificationComponent {

  justifyAchat: any;
  id: any;
  numero_bl: any;
  info_chauffeur: any;
  transport: any;
  paiement: any;
  remarque: any;
  total: any;
  nom_fn: any;
  code_fn: any;
  fournisseur: any;
  lignes: any[] = [];

  updateInfo = {
    phone: '',
    id: 0
  }

  firstRoleName: string | null = null; // Contiendra le premier nom de rôle

  constructor(public router: Router, public fournisseurService: FournisseurService,
    public userService: UserService, public parametreService: ParametreService,
    public commandeService: CommandeService, public toastrService: ToastrService) { }

  ngOnInit() {
    if (localStorage.getItem('justifyAchat') != null) {
      this.justifyAchat = JSON.parse(localStorage.getItem('justifyAchat')!);
      this.lignes = JSON.parse(localStorage.getItem('listLigneJustifyAchatDetail')!);
      this.id = this.justifyAchat.id;
      this.numero_bl = this.justifyAchat.numero_bl;
      this.info_chauffeur = this.justifyAchat.info_chauffeur;
      this.transport = this.justifyAchat.transport;
      this.paiement = this.justifyAchat.paymentType;
      this.remarque = this.justifyAchat.remarque;
      this.total = this.justifyAchat.total;
      this.nom_fn = this.justifyAchat.nom_fn;
      this.code_fn = this.justifyAchat.code_fn;
      this.fournisseurService.getFournisseurByCode(this.code_fn).subscribe(
        data => {
          let resp: any = data;
          this.fournisseur = resp.fournisseur;
        });
      this.userService.getUserLoggin();
      this.refreshRoleAndPermissonsUser();
      // Vérifier si les rôles existent dans l'utilisateur
      if (this.userService.user.roles && this.userService.user.roles.length > 0) {
        // Extraire le nom du premier rôle
        this.firstRoleName = this.userService.user.roles[0].name;
      }
    }
  }

  refreshRoleAndPermissonsUser(): void {
    this.userService.refreshRoleAndPermissonsUser(this.userService.user.id).subscribe(data => {
      let resp: any = data;
      this.userService.user.permissions = resp.user.permissions;
      this.userService.setRoles(resp.user.roles);
    });
  }

  printFacture() {
    this.commandeService.onPrint().subscribe((data) => {
      //let response: any = data;
      window.open('https://www.kasse-boutique.com/server/public/print/justify/achat/id/' + this.id, "_blank");
    });
  }

  sendJustifyWhatsApp() {
    this.fournisseurService.sendJustifyAchatWhatsApp(this.id).subscribe((response: any) => {
      if (response.whatsapp_link) {
        window.open(response.whatsapp_link, "_blank");
      } else {
        this.toastrService.warning("Impossible d'envoyer la facture sur WhatsApp");
      }
    }, error => {
      console.error("Erreur lors de l'envoi de la facture :", error);
    });
  }

  onSubmitUpdatePhone() {
    if (this.nom_fn == "0") {
      this.toastrService.warning("Impossible de faire la mise à jour car ce fournisseur n'existe pas");
    } else {
      this.updateInfo.id = this.fournisseur.id;
      this.fournisseurService.updateInfo(this.updateInfo).subscribe({
        next: (data: any) => {
          let resp: any = data;
          this.updateInfo.phone = '';
          this.updateInfo.id = 0;
          this.toastrService.success('Numéro Fournisseur mis à jour !');
          if (resp.fournisseur.phone) {
            this.sendJustifyWhatsApp();
          }
        },
        error: (err: { error: { message: any; }; }) => {
          console.log(err.error.message);
        }
      });
    }
  }

  editJustify() {
    this.fournisseurService.editJustify(this.justifyAchat);
  }

  deleteJustify() {
    // Appelle le service pour envoyer les données
    Swal.fire({
      title: "Es-tu sûr ?",
      text: "Cette action est irréversible, tu ne pourras pas récupérer cette justification une fois supprimée.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Oui, supprime-le !",
      cancelButtonText: "Non j'annule"
    }).then((result) => {
      if (result.isConfirmed) {
        this.fournisseurService.deleteJustify(this.id).subscribe({
          next: (response) => {
            this.router.navigate(['/list-justification-achat']);
            Swal.fire({
              title: "Supprimer!",
              text: "justification supprimée.",
              icon: "success"
            });
          },
          error: (err) => {
            console.error('Erreur lors de la suppression de la justification :', err);
          },
        });
      }
    });
  }
}
