# Checklist Départ/Arrivée Employé

Application mobile PWA professionnelle pour la gestion des checklists d'arrivée et de départ d'employés (RH, IT, Manager).

## 🚀 Fonctionnalités

- ✅ Gestion des tâches d'onboarding/offboarding par département (RH, IT, Manager)
- 🔔 Notifications en temps réel avec Supabase Realtime
- 📧 Notifications email via Resend
- 📊 Tableau de bord avec suivi de progression
- 🔐 Authentification sécurisée avec Supabase Auth
- 🌐 Multiplateforme : iOS, Android, Web

## 📋 Prérequis

- Node.js 18+
- npm ou yarn
- Compte Supabase
- Compte Resend (pour les emails)
- Expo CLI

## 🛠️ Installation

### 1. Cloner le projet

```bash
git clone <votre-repo>
cd employee-checklist
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configuration des variables d'environnement

Copiez le fichier `.env.example` vers `.env` :

```bash
cp .env.example .env
```

Remplissez avec vos clés :

```env
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=votre-clé-anon

# Resend Email (optionnel)
RESEND_API_KEY=re_xxx
RESEND_RECIPIENT_EMAIL=votre-email@entreprise.com
RESEND_SENDER_EMAIL=onboarding@votre-domaine.com
```

### 4. Configuration Supabase Edge Functions

Configurez les secrets pour les Edge Functions dans votre dashboard Supabase :

```bash
supabase secrets set RESEND_API_KEY=re_xxx
supabase secrets set RESEND_RECIPIENT_EMAIL=votre-email@entreprise.com
supabase secrets set MAKE_WEBHOOK_URL=https://hook.eu1.make.com/xxxxx
```

### 5. Row Level Security (RLS)

Activez RLS sur vos tables Supabase et créez les policies nécessaires. Voir `supabase/migrations` pour les scripts SQL.

## 🏃 Démarrage

```bash
npm start
```

Puis scannez le QR code avec l'app Expo Go ou appuyez sur `a` pour Android, `i` pour iOS.

## 📁 Structure du projet

```
├── app/                    # Pages de l'application (Expo Router)
│   ├── (tabs)/            # Navigation par onglets
│   │   ├── index.tsx      # Tableau de bord
│   │   └── tasks.tsx      # Gestion des tâches
│   ├── employee/          # Pages employé
│   ├── login.tsx          # Connexion
│   └── notifications.tsx  # Notifications
├── components/            # Composants réutilisables
├── hooks/                 # Custom React Hooks
├── lib/                   # Utilitaires et configuration
├── supabase/
│   └── functions/         # Edge Functions
│       ├── send-email/    # Envoi d'emails via Resend
│       └── notify-make/   # Webhook vers Make.com
└── config.toml           # Configuration Supabase
```

## 🔒 Sécurité

### JWT Verification

Les Edge Functions sont configurées avec `verify_jwt = true` pour valider les tokens JWT.

### Row Level Security (RLS)

Exemple de policy pour la table `tasks` :

```sql
-- Lecture : utilisateurs authentifiés
CREATE POLICY "Users can view tasks" ON tasks
  FOR SELECT USING (auth.role() = 'authenticated');

-- Écriture : uniquement les RH et managers
CREATE POLICY "HR and managers can insert tasks" ON tasks
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM user_roles 
      WHERE role IN ('hr', 'manager')
    )
  );
```

## 📧 Configuration des emails

L'envoi d'emails utilise Resend. Configurez les variables suivantes dans Supabase :

1. `RESEND_API_KEY` - Votre clé API Resend
2. `RESEND_RECIPIENT_EMAIL` - Email du destinataire
3. `RESEND_SENDER_EMAIL` - Email de l'expéditeur (optionnel)

## 🔔 Notifications en temps réel

L'application utilise Supabase Realtime pour les notifications :

- Plus de polling toutes les 15 secondes
- Mise à jour instantanée lors des changements
- Réduction de la consommation de batterie et data

## 🛠️ Développement

### Ajouter une migration

```bash
supabase migration new nom_de_la_migration
```

### Déployer les Edge Functions

```bash
supabase functions deploy send-email
supabase functions deploy notify-make
```

### Tests

À implémenter avec Jest et React Native Testing Library.

## 📝 Notes importantes

- **Ne jamais commiter `.env`** - Le fichier est dans `.gitignore`
- Les URLs Supabase sont publiques (`EXPO_PUBLIC_`) car côté client
- Les secrets API (Resend, Make) doivent rester côté serveur (Edge Functions)
- Activez toujours RLS sur vos tables Supabase en production

## 🤝 Contribution

1. Fork le projet
2. Créez une branche (`git checkout -b feature/amélioration`)
3. Committez (`git commit -m 'Ajout fonctionnalité'`)
4. Push (`git push origin feature/amélioration`)
5. Ouvrez une Pull Request

## 📄 License

MIT
