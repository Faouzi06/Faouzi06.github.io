/* Source unique des projets : accueil, page Projets, palette Ctrl+K et tiroir.
   Pour ajouter un projet : copier un bloc, changer le slug et créer projets/<slug>.html. */
window.PROJECTS = [
    {
        slug: "vlanne",
        title: "VLANNE",
        subtitle: "AP-2 · Maison des Ligues (M2L)",
        domain: "reseau",
        impact: "Segmenter le réseau de la M2L en six VLAN et filtrer les flux inter-services par ACL.",
        tags: ["Cisco IOS", "802.1Q", "ACL étendues"],
        period: "1re année · 2026",
        context: "Équipe OSTIA (4 personnes)",
        role: "Plan d'adressage, routage inter-VLAN et ACL",
        preview: "assets/img/vlanne/schema-vlan.png",
        lead: "Le réseau plat de la Maison des Ligues expose tout le SI à la propagation d'un virus. Objectif : isoler les flux logiques sur la même infrastructure physique.",
        points: [
            "Plan d'adressage de 6 VLAN en 172.16.x.0/24",
            "Trunks 802.1Q en mode nonegotiate (protection contre le VLAN hopping)",
            "Routage inter-VLAN en Router-on-a-Stick",
            "ACL étendues 101/102 : Wi-Fi public et salles ressources bloqués vers l'Administration"
        ],
        featured: true
    },
    {
        slug: "superviz",
        title: "SUPERVIZ",
        subtitle: "AP-2 · Maison des Ligues (M2L)",
        domain: "supervision",
        impact: "Superviser l'infrastructure en SNMPv3 et transformer les alertes en tickets GLPI.",
        tags: ["Zabbix 6.4", "SNMPv3", "PowerShell"],
        period: "1re année · 2026",
        context: "Équipe OSTIA (4 personnes)",
        role: "Script PowerShell d'audit AD et intégration GLPI",
        preview: "assets/img/superviz/architecture.png",
        lead: "Passer d'une gestion réseau réactive à une supervision proactive, reliée à l'outil de ticketing de la M2L.",
        points: [
            "Architecture Zabbix / Syslog / GLPI dans le VLAN Administration",
            "SNMPv3 en mode authPriv (SHA + AES-128) à la place de SNMPv2c",
            "Audit de la réplication Active Directory en PowerShell",
            "Détection du Shadow IT en Bash (cron) et ouverture de tickets via l'API REST de GLPI"
        ],
        featured: true
    },
    {
        slug: "glpi-novaservices",
        title: "GLPI NovaServices",
        subtitle: "Projet fil rouge · binôme",
        domain: "support",
        impact: "Monter une instance de recette GLPI 11 entièrement scriptée et dérouler 13 tests d'intégration.",
        tags: ["GLPI 11", "Debian 13", "Bash"],
        period: "Oct. – nov. 2026",
        context: "Binôme · NovaServices, 120 collaborateurs (fictif)",
        role: "Toutes les étapes, à parts égales avec mon binôme",
        preview: "assets/img/glpi/04-ticket-resolu.jpg",
        lead: "Mettre à disposition un service de support utilisateurs : de l'instance de recette au dossier de stratégie de déploiement.",
        points: [
            "Script d'installation idempotent en 8 étapes (Apache, MariaDB, PHP 8.4, GLPI 11.0.8)",
            "Jeu de données importé : comptes pilotes, techniciens et 6 tickets initiaux",
            "13 tests exécutés : 10 réussis, 3 échoués, 5 anomalies qualifiées",
            "Stratégie de déploiement progressif par vagues et procès-verbal de recette"
        ],
        featured: true
    },
    {
        slug: "infra-proxmox",
        title: "Infrastructure Proxmox",
        subtitle: "Projet d'infrastructure · en cours",
        domain: "systemes",
        impact: "Virtualiser un contrôleur de domaine Windows Server 2025 (AD DS, DNS) sur Proxmox VE.",
        tags: ["Proxmox VE", "AD DS / DNS", "pfSense"],
        period: "Oct. 2026 → en cours",
        context: "Équipe de 4 · BTS SIO SISR 2e année",
        role: "Réalisé en équipe",
        preview: "assets/img/proxmox/04-nouvelle-foret.png",
        lead: "Construire pas à pas une infrastructure virtualisée : hyperviseur, routeur, annuaire et services réseau.",
        points: [
            "VM Windows Server 2025 en UEFI + TPM 2.0 avec pilotes VirtIO",
            "Contrôleur de domaine SRV-AD01 : nouvelle forêt Projet.lan et DNS intégré",
            "Vérification du réseau (nmap) avant de fixer l'adressage",
            "Snapshots Proxmox avant chaque étape critique"
        ],
        featured: true
    },
    {
        slug: "borne-wifi-cisco",
        title: "Borne Wi-Fi Cisco",
        subtitle: "TP · Cisco AIR-AP2802I",
        domain: "reseau",
        impact: "Mettre en service une borne Cisco et un réseau invité à portail captif.",
        tags: ["Mobility Express", "PuTTY", "Portail captif"],
        period: "Oct. 2026",
        context: "Équipe de 4 · TP en salle réseau",
        role: "Réalisé en équipe",
        preview: "assets/img/wifi/02-erreur-passerelle.png",
        lead: "Configurer un point d'accès Cisco en console série, puis créer un réseau invité isolé derrière un portail captif.",
        points: [
            "Réinitialisation d'usine et assistant de configuration en console (PuTTY)",
            "IP de management fixe, serveur DHCP de la borne volontairement désactivé",
            "SSID sécurisé en WPA2-PSK",
            "Réseau invité AP-INVITE : portail captif et comptes locaux à durée limitée"
        ],
        featured: false
    },
    {
        slug: "durcissement-windows",
        title: "Durcissement Windows",
        subtitle: "Cybersécurité · poste client M2L",
        domain: "securite",
        impact: "Appliquer les recommandations CIS niveau 1 à un poste client et prouver chaque mesure.",
        tags: ["PowerShell", "Stratégies locales", "CIS L1"],
        period: "Sept. 2026",
        context: "Équipe de 4 · atelier cybersécurité",
        role: "Réalisé en équipe",
        preview: "assets/img/windows/01-comptes.jpg",
        lead: "Durcir un poste livré en configuration par défaut, sans jamais perdre l'accès, avec un audit avant et après.",
        points: [
            "Audit initial : ports en écoute, services, comptes locaux, SMB",
            "Compte Invité désactivé, compte administrateur renommé",
            "Mots de passe de 14 caractères, verrouillage après 5 échecs",
            "SMBv1, LLMNR et exécution automatique désactivés ; NTLMv2 uniquement"
        ],
        featured: true
    },
    {
        slug: "securisation-debian",
        title: "Sécurisation Debian",
        subtitle: "Cybersécurité · serveur Linux",
        domain: "securite",
        impact: "Cartographier la surface d'attaque, puis faire passer un serveur Debian de 63 à 70/100 sur Lynis.",
        tags: ["SSH", "Fail2ban", "UFW"],
        period: "Sept. 2026",
        context: "Équipe de 4 · atelier cybersécurité",
        role: "Réalisé en équipe",
        preview: "",
        lead: "Relever l'état initial (T0) d'une VM Debian et d'une VM Windows, puis consolider le socle Linux et mesurer le gain.",
        points: [
            "Relevé T0 : ports en écoute, services actifs, comptes",
            "SSH par clé Ed25519 uniquement",
            "Fail2ban sur sshd, pare-feu UFW en refus par défaut",
            "AppArmor vérifié, CUPS et Avahi masqués : seul le port 22 reste exposé"
        ],
        featured: false
    }
];

/* V2 · position dans la baie, compétences du référentiel (bloc 1) et pile technique complète */
(function () {
    const META = {
        "vlanne":               { srv: "SRV-01", u: "U40-39", status: "Validé",   skills: ["B1.1", "B1.4", "B1.5"],         stack: ["Cisco IOS", "VLAN", "802.1Q", "ACL", "Packet Tracer"] },
        "superviz":             { srv: "SRV-02", u: "U38-37", status: "Validé",   skills: ["B1.1", "B1.2", "B1.4", "B1.5"], stack: ["Zabbix", "SNMPv3", "Syslog", "GLPI", "PowerShell", "Bash"] },
        "glpi-novaservices":    { srv: "SRV-03", u: "U36-35", status: "Validé",   skills: ["B1.1", "B1.2", "B1.4", "B1.5"], stack: ["GLPI", "Debian", "Apache", "MariaDB", "PHP", "Bash", "VirtualBox"] },
        "infra-proxmox":        { srv: "SRV-04", u: "U34-33", status: "En cours", skills: ["B1.1", "B1.4", "B1.5"],         stack: ["Proxmox", "Windows Server", "Active Directory", "DNS", "PowerShell", "pfSense"] },
        "borne-wifi-cisco":     { srv: "SRV-05", u: "U32-31", status: "Validé",   skills: ["B1.1", "B1.5"],                 stack: ["Cisco", "Wi-Fi", "Portail captif", "PuTTY"] },
        "durcissement-windows": { srv: "SRV-06", u: "U30-29", status: "Validé",   skills: ["B1.1", "B1.5"],                 stack: ["Windows", "PowerShell", "GPO", "CIS"] },
        "securisation-debian":  { srv: "SRV-07", u: "U28-27", status: "Validé",   skills: ["B1.1", "B1.5"],                 stack: ["Debian", "SSH", "Fail2ban", "UFW", "AppArmor", "Bash"] }
    };
    window.PROJECTS.forEach((p) => Object.assign(p, META[p.slug] || {}));
})();

window.SKILLS = {
    "B1.1": "Gérer le patrimoine informatique",
    "B1.2": "Répondre aux incidents et aux demandes",
    "B1.3": "Développer la présence en ligne",
    "B1.4": "Travailler en mode projet",
    "B1.5": "Mettre à disposition un service",
    "B1.6": "Organiser son développement professionnel"
};

window.DOMAINS = {
    reseau: "Réseau",
    supervision: "Supervision",
    support: "Support & ITSM",
    systemes: "Systèmes",
    securite: "Cybersécurité"
};
