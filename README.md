# Portfolio V2 — Ahmed Faouzi · BTS SIO SISR · thème « baie informatique »

Site statique (HTML, CSS, JavaScript, sans framework ni compilation, aucune librairie externe à part les polices Google).
Le site est présenté comme une baie 42U documentée façon plan technique : chaque équipement est une section.

| Équipement | Emplacement | Page |
|---|---|---|
| PP-01 · panneau de brassage | U42 | navigation (un port = une page) |
| SW-01 · switch | U41 | `projects.html` |
| SRV-01 → SRV-07 · serveurs 2U | U40 → U27 | `projets/*.html` (un serveur par projet) |
| FW-01 · pare-feu | U26 | `veille.html` |
| RT-01 · routeur | U25 | `competences.html` |
| NAS-01 | U24-23 | `e5.html` |
| KVM-01 | U22 | `contact.html` |
| UPS-01 · onduleur | U2-1 | `about.html` |

## Arborescence

```
index.html                 Accueil : élévation de la baie, panneau de détail, console, supervision
projects.html              Projets : baie de serveurs + filtres domaine / technologie / compétence
projets/*.html             Fiches : façade serveur, frise, galerie lightbox, schémas interactifs, code
competences.html           Modules par domaine (voyant = preuve), table de routage du référentiel, langues
veille.html                Tableau de bord, infographie, frise, articles en cartes illustrées
e5.html                    Tableau de synthèse E5 (imprimable, version Excel téléchargeable)
about.html                 Parcours : fiche d'inventaire (asset tag), alternance, formation
contact.html               Port console + formulaire (ouvre la messagerie du visiteur)
assets/css/style.css       Système de design (thème sombre unique) et pages intérieures
assets/css/rack.css        Baie de l'accueil
assets/js/projects.js      Données des projets (position dans la baie, compétences, technos)
assets/js/main.js          Palette Ctrl+K, menu mobile, copie de l'e-mail
assets/js/rack.js          Accueil : détail des équipements, câbles de brassage, supervision
assets/js/console.js       Console (help, show projects, whoami, open…)
assets/js/projects-page.js Liste et filtres des projets
assets/js/case.js          Fiches : coloration, façade, lightbox, schémas interactifs
assets/js/skills-page.js   Page Compétences
assets/js/veille.js        Page Veille
assets/data/veille.json    Articles de veille (généré automatiquement)
tools/maj-veille.ps1       Agrégation des flux RSS + images des articles
.github/workflows/veille.yml  Mise à jour automatique de la veille (toutes les 6 h)
tools/serveur-local.ps1    Serveur local utilisé par lancer-site.bat
lancer-site.bat            Double-clic : ouvre le site en local
```

Les versions précédentes (V0, V1) et les maquettes de la V2 sont rangées à part, dans
`Bureau\portfolio-anciennes-versions`.

## Lancer le site en local

Le fil de veille charge un fichier JSON : il faut un petit serveur web (ouvrir `index.html` directement ne suffit pas).

**Le plus simple : double-cliquer sur `lancer-site.bat`.** Le navigateur s'ouvre sur http://localhost:8766.
Garder la fenêtre noire ouverte pendant la consultation ; la fermer arrête le site.

Équivalent en ligne de commande (aucune installation, PowerShell suffit) :

```
powershell -ExecutionPolicy Bypass -File tools\serveur-local.ps1 -Port 8766
```

Python n'est pas nécessaire. S'il est installé, `python -m http.server 8000` fonctionne aussi.

## Mettre à jour la veille à la main

```
powershell -ExecutionPolicy Bypass -File tools\maj-veille.ps1
```

## Déployer sur GitHub Pages

1. Pousser ce dossier dans un dépôt GitHub public.
2. **Settings → Pages → Deploy from a branch → main / (root)**.
3. **Settings → Actions → General → Workflow permissions → Read and write**.
4. **Actions → Mise à jour de la veille → Run workflow** pour la première mise à jour.

Les dossiers commençant par `_` ne sont pas publiés par GitHub Pages.

## Accessibilité

- Menu classique toujours présent et plan du site sous la baie : la baie n'est jamais le seul moyen de naviguer.
- Équipements, ports, schémas et galerie utilisables au clavier ; panneaux de détail annoncés aux lecteurs d'écran.
- `prefers-reduced-motion` : clignotements et animations de câble désactivés.
