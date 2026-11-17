# ---------------------------------------------------------------------------
# AP-2 SUPERVIZ (M2L) - Audit de la réplication Active Directory
# Cible : contrôleur de domaine Windows Server 2025
# Écrit une alerte dans le journal Application si une réplication échoue,
# avant même qu'un utilisateur n'ouvre un ticket.
# ---------------------------------------------------------------------------

# Récupération du statut de réplication AD sur le contrôleur local
$ReplicationStatus = Get-ADReplicationPartnerMetadata -Target "$env:computername"

# Filtrage des réplications en échec (code résultat différent de 0)
$FailedReplications = $ReplicationStatus | Where-Object { $_.LastReplicationResult -ne 0 }

if ($FailedReplications) {
    # Écriture dans le journal d'événements Windows (visible dans l'Observateur d'événements)
    Write-EventLog -LogName "Application" `
        -Source "M2L-Supervision" `
        -EventId 1001 `
        -EntryType Error `
        -Message "Alerte : Echec de la replication Active Directory detecte."
    # Possibilité d'envoyer une alerte SNMP Trap ou d'ouvrir un ticket GLPI (API REST)
} else {
    Write-Output "Replication AD saine - aucune action requise."
}
