import { DatePipe } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { StatistiqueService } from 'src/app/services/statistique.service';
import { ChartConfiguration } from 'chart.js';
import { HttpClient } from '@angular/common/http';
import { BaseChartDirective } from 'ng2-charts';
import { Router } from '@angular/router';
import { LocalStorageService } from 'src/app/services/local-storage.service';
import { UserService } from 'src/app/services/user.service';
import { parseISO, startOfWeek, addDays, format, isSameDay, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  listProduit!: any[];
  listProduitByDate!: any[];
  listProduitBy2Date!: any[];
  nbrPdt: number = 0;
  nbrPdtByDate: number = 0;
  nbrPdtBy2Date: number = 0;
  isDate: boolean = false;
  is2Date: boolean = false;
  date: any;

  commandesDuJour: number = 0;
  commandesDuJourInvalide: number = 0;

  /* Start Diagramme des ventes */
  startDate: string = '';
  endDate: string = '';

  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;
  public chartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Total TTC',
        fill: true,
        borderColor: '#007bff',
        backgroundColor: 'rgba(0,123,255,0.2)',
        tension: 0.4,
        pointRadius: 4
      }
    ]
  };

  public chartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top'
      }
    },
    scales: {
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 0
        }
      },
      y: {
        beginAtZero: true
      }
    }
  };
  /* End Diagramme des ventes */

  firstRoleName: string | null = null; // Contiendra le premier nom de rôle

  constructor(
    public statistiqueService: StatistiqueService, public userService: UserService,
    private datePipe: DatePipe, public router: Router, public localStorageService: LocalStorageService,
    private http: HttpClient
  ) { }

  ngOnInit() {
    this.getMostSeller();
    this.getChartData();
    this.refreshRoleAndPermissonsUser();
    // Vérifier si les rôles existent dans l'utilisateur
    if (this.userService.user.roles && this.userService.user.roles.length > 0) {
      // Extraire le nom du premier rôle
      this.firstRoleName = this.userService.user.roles[0].name;
    }
  }

  refreshRoleAndPermissonsUser(): void {
    this.userService.refreshRoleAndPermissonsUser(this.userService.user.id).subscribe(data => {
      let resp: any = data;
      this.userService.user.permissions = resp.user.permissions;
      this.userService.setRoles(resp.user.roles);
    });
  }

  getChartData() {
    this.statistiqueService.getVentesParJour().subscribe(data => {
      const today = new Date();
      const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Lundi

      const labels: string[] = [];
      const values: number[] = [];

      // Construire les 7 jours de la semaine
      for (let i = 0; i < 7; i++) {
        const currentDate = addDays(weekStart, i);
        const dateStr = format(currentDate, 'dd-MM-yyyy');
        labels.push(dateStr);

        // Chercher la vente correspondante
        const entry = data.find(item => isSameDay(parseISO(item.date), currentDate));
        values.push(entry ? entry.total : 0);
      }

      this.chartData = {
        labels: labels,
        datasets: [
          {
            data: values,
            label: 'Total TTC (Semaine en cours)',
            fill: true,
            borderColor: '#007bff',
            backgroundColor: 'rgba(0,123,255,0.2)',
            tension: 0.4,
            pointRadius: 4
          }
        ]
      };

      setTimeout(() => {
        this.chart?.update();
      }, 0);
    });
  }

  getChartDataDates() {
    if (!this.startDate || !this.endDate) return;

    this.statistiqueService.getVentesParJourFexible(this.startDate, this.endDate).subscribe(data => {
      const labels: string[] = [];
      const values: number[] = [];

      const startStr = format(parseISO(this.startDate), 'EEEE dd MMMM yyyy', { locale: fr });
      const endStr = format(parseISO(this.endDate), 'EEEE dd MMMM yyyy', { locale: fr });
      const label = `Total TTC du ${startStr} au ${endStr}`;

      const start = parseISO(this.startDate);
      const end = parseISO(this.endDate);
      const nbDays = differenceInDays(end, start);

      for (let i = 0; i <= nbDays; i++) {
        const currentDate = addDays(start, i);
        const dateStr = format(currentDate, 'dd-MM-yyyy');
        // Ajoute la valeur
        const vente = data.find(item => isSameDay(parseISO(item.date), currentDate));
        values.push(vente ? vente.total : 0);

        // Ajoute le label uniquement si :
        // - l'intervalle est petit (<= 7 jours), ou
        // - c'est le premier ou dernier jour
        if (nbDays <= 7 || i === 0 || i === nbDays) {
          labels.push(dateStr);
        } else {
          labels.push(''); // label vide pour éviter surcharge visuelle
        }
      }

      this.chartData = {
        labels: labels,
        datasets: [
          {
            data: values,
            label: label,
            fill: true,
            borderColor: '#007bff',
            backgroundColor: 'rgba(0,123,255,0.2)',
            tension: 0.4,
            pointRadius: 4
          }
        ]
      };

      setTimeout(() => {
        this.chart?.update();
      }, 0);
    });
  }

  onDateChange() {
    this.getChartDataDates(); // Met à jour dès qu'une date change
  }

  getInfo() {
    this.statistiqueService.getInfo().subscribe(res => {
      let response: any = res;
      this.commandesDuJour = response.commandesDuJour.length;
      this.commandesDuJourInvalide = response.commandesDuJourInvalide.length;
    })
  }

  getMostSeller() {
    this.statistiqueService.getMostSeller().subscribe(res => {
      let response: any = res;
      this.listProduit = response;
      this.nbrPdt = this.listProduit.length;

      for (var i = 0; i < this.nbrPdt; i++) {
        const qtyOut = this.listProduit[i].sum_qty;
        const qtyInit = this.listProduit[i].qty_init;
        this.listProduit[i].perCent = Math.round((qtyOut * 100) / qtyInit);
      }

    })
  }

  onChangeDate(ctrl: any) {
    if (ctrl.value) {
      this.isDate = true;

      const date = this.datePipe.transform(ctrl.value, 'yyyy-MM-dd');

      this.statistiqueService.getMostSellerByDate(date).subscribe(res => {
        const response: any = res;
        this.listProduitByDate = response;
        this.nbrPdtByDate = this.listProduitByDate.length;

        for (let i = 0; i < this.nbrPdtByDate; i++) {
          const produit = this.listProduitByDate[i];

          // Sécurité : si un champ est null, on le force à 0
          const qtyOut = Number(produit.sum_qty) || 0;      // quantité vendue
          const qtyRest = Number(produit.qty_rest) || 0;    // quantité restante actuelle

          // Quantité initiale du jour = restant + vendu
          const qtyInit = qtyRest + qtyOut;

          // Calcul du pourcentage vendu (évite la division par 0)
          produit.perCent = qtyInit > 0 ? Math.round((qtyOut * 100) / qtyInit) : 0;
        }
      });
    } else {
      this.isDate = false;
    }
  }

  onChange2DatesFirst(ctrl: any) {
    if (ctrl.value) {
      let date = this.datePipe.transform(ctrl.value, 'yyyy-MM-dd');
      this.date = date;
    }
  }

  onChange2DatesSecond(ctrl: any) {
    if (ctrl.value) {
      this.is2Date = true;
      let dateFin = this.datePipe.transform(ctrl.value, 'yyyy-MM-dd');

      // Récupérer les ventes entre les deux dates
      this.statistiqueService.getMostSellerBy2Date(this.date, dateFin).subscribe(res => {
        let response: any = res;
        this.listProduitBy2Date = response;
        this.nbrPdtBy2Date = this.listProduitBy2Date.length;

        for (let i = 0; i < this.nbrPdtBy2Date; i++) {
          const produit = this.listProduitBy2Date[i];

          // Sécurisation
          const qtyRestAujourdhui = Number(produit.qty_rest) || 0; // stock du jour actuel (fin de période)
          const ventesPeriode = Number(produit.sum_qty) || 0;       // ventes sur la période

          // ⚙️ Quantité initiale au début de la période
          const qtyInitPeriode = qtyRestAujourdhui + ventesPeriode;

          // Assignation correcte
          produit.qty_init = qtyInitPeriode;
          produit.qty_rest = qtyRestAujourdhui;
          produit.sum_qty = ventesPeriode;

          // Pourcentage de vente sur la période
          produit.perCent = qtyInitPeriode > 0 ? Math.round((ventesPeriode * 100) / qtyInitPeriode) : 0;
        }
      });
    } else {
      this.is2Date = false;
    }
  }

  routeFrais() {
    // Utilisation de la fonction clearLocalStorage
    const exceptions = ['user', 'token', 'payment'];
    this.localStorageService.clearLocalStorage(exceptions);
    this.router.navigate(['/frais']);
  }

  routeRapport() {
    // Utilisation de la fonction clearLocalStorage
    const exceptions = ['user', 'token', 'payment'];
    this.localStorageService.clearLocalStorage(exceptions);
    this.router.navigate(['/rapport']);
  }
}
