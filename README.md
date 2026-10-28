# Blockfacho auto-block (X)

Bloque automatiquement sur X tous les comptes de la liste vérifiée [blockfacho](https://blockfacho.readymoss8.chatgpt.site/site), depuis ton navigateur, avec ton compte.

- **Aucun mot de passe, aucun token.** Le script clique sur le vrai bouton « Bloquer » de X, dans ta session.
- **Liste à jour.** Elle est récupérée en direct sur le site, avec les ajouts et les retraits validés.
- **Reprend où tu t'es arrêté.** Les comptes déjà bloqués sont sautés, et les nouveaux arrivent à la fin.

## Installer (2 min)

1. Installe [Tampermonkey](https://www.tampermonkey.net/).
2. Chrome seulement : `chrome://extensions` → Tampermonkey → **Détails** → active **Autoriser les scripts utilisateur**.
3. Clique ici : **[installer le script](https://raw.githubusercontent.com/WeaversEpigone/XAutoBlockFarRight/main/blockfacho-x.user.js)**. Tampermonkey propose de l'installer, puis le met à jour tout seul depuis l'endroit où tu l'as installé.

## Utiliser

Sur [x.com](https://x.com), connecté, un panneau apparaît en bas à droite.

1. **Charger la liste**, puis ouvre « Voir les comptes » pour vérifier.
2. **Test** coché → **Démarrer** : vérifie 3 profils sans rien bloquer.
3. Décoche **Test** → **Démarrer**. Ça tourne jusqu'à la fin de la liste ou jusqu'à **Stop**.

| Besoin | Que faire |
| --- | --- |
| La liste a grandi | **Charger la liste** puis **Démarrer** : seuls les nouveaux comptes restent à faire. |
| Changer de navigateur ou d'ordi | Note le « Dernier bloqué : n° X » et mets X + 1 dans **Commencer à**. |
| Reprendre à partir d'un compte précis | Tape son `@` (ou colle le lien du profil) dans **Commencer à**. |
| Reprendre après un arrêt | **Démarrer** suffit, rien n'est refait. |

> [!WARNING]
> X interdit l'automatisation hors de son API. Bloquer des centaines de comptes d'affilée peut provoquer une limite temporaire ou un verrouillage du compte. Si le script s'arrête avec un message de redirection ou de limite, attends quelques heures avant de relancer. Tu l'utilises à tes risques.

## La liste dans ce dépôt

[`list/x.txt`](list/x.txt) et [`list/x.json`](list/x.json) sont une copie de la liste, mise à jour toutes les 6 h par [une GitHub Action](.github/workflows/update-list.yml). L'historique des commits montre qui a été ajouté ou retiré, et quand. Le script lit la version en direct du site, et se rabat sur cette copie si le site est indisponible.

## Si ça casse

X change parfois son interface. Le script s'arrête alors avec un message au lieu de cliquer au hasard. Ouvre une issue avec ce message, ou corrige les sélecteurs `SEL` en haut du script.

## Développer

```bash
node scripts/update-list.js       # régénère list/ depuis le site
mkdir -p data && curl -s -o data/accounts.js https://blockfacho.readymoss8.chatgpt.site/accounts.js && curl -s -o data/accounts https://blockfacho.readymoss8.chatgpt.site/api/accounts
node scripts/test-load.js data    # vérifie la fusion de la liste et l'ordre de reprise
```

Licence [MIT](LICENSE). Projet indépendant, sans lien avec X ni avec le site blockfacho.
