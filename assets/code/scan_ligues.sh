#!/bin/bash
# ---------------------------------------------------------------------------
# AP-2 SUPERVIZ (M2L) - Détection du Shadow IT sur le VLAN 20 (Ligues)
# Planification cron (toutes les heures) :
#   0 * * * * root /opt/scripts/scan_ligues.sh
# ---------------------------------------------------------------------------

SUBNET="172.16.20"
KNOWN_HOSTS="/opt/scripts/known_hosts.txt"
LOG="/var/log/m2l_scan.log"

echo "--- Scan $(date) ---" >> "$LOG"
echo "Scan en cours sur $SUBNET.0/24..."

for ip in {1..254}; do
    ping -c 1 -W 1 "$SUBNET.$ip" > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        # Vérification : l'IP figure-t-elle dans la liste des équipements connus ?
        if ! grep -q "$SUBNET.$ip" "$KNOWN_HOSTS"; then
            echo "[ALERTE] Equipement non autorise detecte : $SUBNET.$ip" | tee -a "$LOG"
            # Possibilité d'envoyer une alerte SNMP Trap ou d'ouvrir un ticket GLPI
        fi
    fi
done
