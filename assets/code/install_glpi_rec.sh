#!/bin/bash
# ---------------------------------------------------------------------------
# NovaServices - Installation de l'instance GLPI 11.0.8 de recette (REC)
# Cible : Debian 13 (VM VirtualBox). A lancer en root :  bash /mnt/install.sh
# Le script peut etre relance sans risque : chaque etape verifie l'existant.
# ---------------------------------------------------------------------------
LOG=/root/install_glpi_rec.log
exec > >(tee -a "$LOG") 2>&1
set -e
SRC="$(cd "$(dirname "$0")" && pwd)"
DB=glpi_rec
DBUSER=glpi_rec
CRED=/root/glpi_rec_db.txt

step() { echo; echo "===== [$1] $2 ====="; }
trap 'echo; echo "##### ECHEC - voir le journal $LOG #####"' ERR

step 1/8 "Installation des paquets (Apache, MariaDB, PHP)"
export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y apache2 mariadb-server php libapache2-mod-php \
  php-mysql php-curl php-gd php-intl php-xml php-mbstring php-zip \
  php-bz2 php-ldap php-bcmath php-apcu openssl wget

step 2/8 "Deploiement des fichiers GLPI 11.0.8"
if [ -d /var/www/glpi ]; then
  echo "Dossier /var/www/glpi deja present : extraction ignoree."
else
  tar -xzf "$SRC/glpi.tgz" -C /var/www/
fi
chown -R www-data:www-data /var/www/glpi
echo "Version deployee : $(ls /var/www/glpi/version)"

step 3/8 "Configuration d'Apache et de PHP"
cat > /etc/apache2/sites-available/glpi.conf <<'EOF'
<VirtualHost *:80>
    ServerName glpi-rec.novaservices.test
    DocumentRoot /var/www/glpi/public

    <Directory /var/www/glpi/public>
        Require all granted
        RewriteEngine On
        RewriteCond %{HTTP:Authorization} ^(.+)$
        RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteRule ^(.*)$ index.php [QSA,L]
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/glpi_error.log
    CustomLog ${APACHE_LOG_DIR}/glpi_access.log combined
</VirtualHost>
EOF
a2enmod rewrite
a2dissite 000-default || true
a2ensite glpi
PHPV=$(php -r 'echo PHP_MAJOR_VERSION.".".PHP_MINOR_VERSION;')
printf 'session.cookie_httponly = On\n' > "/etc/php/$PHPV/apache2/conf.d/99-glpi.ini"
systemctl restart apache2

step 4/8 "Creation de la base de donnees"
systemctl enable --now mariadb
if [ ! -f "$CRED" ]; then
  DBPASS=$(openssl rand -hex 12)
  printf 'base=%s\nutilisateur=%s\nmot_de_passe=%s\n' "$DB" "$DBUSER" "$DBPASS" > "$CRED"
  chmod 600 "$CRED"
else
  DBPASS=$(sed -n 's/^mot_de_passe=//p' "$CRED")
fi
mariadb -e "CREATE DATABASE IF NOT EXISTS $DB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '$DBUSER'@'localhost' IDENTIFIED BY '$DBPASS';
ALTER USER '$DBUSER'@'localhost' IDENTIFIED BY '$DBPASS';
GRANT ALL PRIVILEGES ON $DB.* TO '$DBUSER'@'localhost';
FLUSH PRIVILEGES;"
mariadb-tzinfo-to-sql /usr/share/zoneinfo 2>/dev/null | mariadb mysql || true
mariadb -e "GRANT SELECT ON mysql.time_zone_name TO '$DBUSER'@'localhost'; FLUSH PRIVILEGES;" || true
echo "Identifiants de la base enregistres dans $CRED (lecture root uniquement)."

step 5/8 "Installation de GLPI en ligne de commande"
cd /var/www/glpi
if [ -f /var/www/glpi/config/config_db.php ]; then
  echo "GLPI deja installe (config_db.php present) : etape ignoree."
else
  runuser -u www-data -- php bin/console db:install \
    -H localhost -d "$DB" -u "$DBUSER" -p "$DBPASS" -L fr_FR --no-interaction
fi
runuser -u www-data -- php bin/console database:enable_timezones || true

step 6/8 "Import du jeu de donnees NovaServices"
if [ -f /root/.novaservices_init_ok ]; then
  echo "Jeu de donnees deja importe : etape ignoree."
else
  mariadb "$DB" < "$SRC/nova.sql"
  touch /root/.novaservices_init_ok
fi

step 7/8 "Finitions"
rm -f /var/www/glpi/install/install.php
runuser -u www-data -- php bin/console cache:clear || true

step 8/8 "Verifications"
echo "Apache  : $(systemctl is-active apache2)"
echo "MariaDB : $(systemctl is-active mariadb)"
php -v | head -1
mariadb --version
echo "GLPI    : $(ls /var/www/glpi/version)"
echo "Page d'accueil : $(wget -qO- http://localhost/ | grep -o '<title>[^<]*' | head -1)"
echo "Comptes de laboratoire presents :"
mariadb -N -e "SELECT name FROM $DB.glpi_users WHERE name IN ('pilote1','pilote2','tech1','tech2') ORDER BY name;"
echo "Tickets initiaux : $(mariadb -N -e "SELECT COUNT(*) FROM $DB.glpi_tickets;")"
echo
echo "===== INSTALLATION TERMINEE - GLPI REC : http://localhost:8080 depuis le PC ====="
