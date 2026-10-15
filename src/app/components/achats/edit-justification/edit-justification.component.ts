import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from 'src/app/services/user.service';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { ParametreService } from 'src/app/services/parametre.service';
import { DatePipe } from '@angular/common';
import { AchatService } from 'src/app/services/achat.service';
import { FournisseurService } from 'src/app/services/fournisseur.service';

@Component({
  selector: 'app-edit-justification',
  templateUrl: './edit-justification.component.html',
  styleUrls: ['./edit-justification.component.scss']
})
export class EditJustificationComponent implements OnInit {

  formAchat!: FormGroup;

  fournisseur: any;
  id: any;
  numero_bl: any;
  info_chauffeur: any;
  transport: any;
  paiement: any;
  remarque: any;

  justifyAchat: any;

  ligneNoSoldees: any[] = [];

  isDisable: boolean = false;
  isClick: boolean = false;

  constructor(public router: Router, public fournisseurService: FournisseurService,
    public fb: FormBuilder, public userService: UserService,
    public toastrService: ToastrService, public parametreService: ParametreService,
    public achatService: AchatService, private datePipe: DatePipe,) { }

  ngOnInit() {
    if (localStorage.getItem('justifyAchat') != null) {
      this.justifyAchat = JSON.parse(localStorage.getItem('justifyAchat')!);
      this.ligneNoSoldees = JSON.parse(localStorage.getItem('listLigneJustifyAchat')!);
      this.id = this.justifyAchat.id;
      this.numero_bl = this.justifyAchat.numero_bl;
      this.info_chauffeur = this.justifyAchat.info_chauffeur;
      this.transport = this.justifyAchat.transport;
      this.paiement = this.justifyAchat.paymentType;
      this.remarque = this.justifyAchat.remarque;
      this.fournisseur = this.justifyAchat.nom_fn;

      for (var i = 0; i < this.ligneNoSoldees.length; i++) {
        this.ligneNoSoldees[i].checked = true;
      }
    }
  }

  editLignes() {
    this.isDisable = true; this.isClick = true;

    const payload = {
      id: this.id,
      numero_bl: this.numero_bl,
      info_chauffeur: this.info_chauffeur,
      paiement: this.paiement,
      transport: this.transport,
      remarque: this.remarque,
      auteur: this.userService.name,
      lignes: this.ligneNoSoldees
        .filter(l => l.checked) // 👈 on garde seulement les lignes cochées
        .map(l => ({
          id: l.id,
          date_saisie: l.date
        }))
    };

    if (payload.lignes.length === 0) {
      this.toastrService.warning('Veuillez cocher au moins une ligne');
      this.isDisable = false; this.isClick = false;
      return;
    }

    // Vérifie si une ligne cochée n'a pas de date saisie
    const ligneSansDate = payload.lignes.some(l => !l.date_saisie);

    if (ligneSansDate) {
      this.toastrService.warning('Veuillez saisir une date pour toutes les lignes cochées');
      this.isDisable = false; this.isClick = false;
      return;
    }

    this.fournisseurService.editLignes(payload).subscribe({
      next: (data) => {
        let resp: any = data;
        this.toastrService.success('Lignes enregistrées avec succès !');
        this.isDisable = false; this.isClick = false;
        this.fournisseurService.detailJustify(resp.justifyAchat);
      },
      error: (err) => {
        this.toastrService.error('Erreur lors de l\'enregistrement');
        this.isDisable = false; this.isClick = false;
        console.error(err);
      }
    });
  }

}
