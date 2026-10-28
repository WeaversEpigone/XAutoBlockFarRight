Bloque automatiquement sur X tous les comptes de la liste vérifiée [blockfacho](https://blockfacho.readymoss8.chatgpt.site/site), depuis ton navigateur, avec ton compte.

- **Aucun mot de passe, aucun token.** Le script clique sur le vrai bouton « Bloquer » de X, dans ta session.
- **Liste à jour.** Le script lit une copie de la liste sur GitHub, mise à jour depuis le site toutes les 6 h (ajouts et retraits validés). Si GitHub ne répond pas, il lit le site directement.
- **Reprend où tu t'es arrêté.** Les comptes déjà bloqués sont sautés, et les nouveaux arrivent à la fin.

## Utiliser

Sur [x.com](https://x.com), connecté, un panneau apparaît en bas à droite.

1. **Charger la liste**, puis ouvre « Voir les comptes » pour vérifier qui sera bloqué.
2. **Test** coché, puis **Démarrer** : le script vérifie 3 profils sans rien bloquer.
3. Décoche **Test**, puis **Démarrer**. Ça tourne jusqu'à la fin de la liste ou jusqu'à **Stop**.

**Commencer à** accepte un numéro de la liste, un `@compte` ou un lien de profil.

Chrome : active **Autoriser les scripts utilisateur** dans `chrome://extensions` → Tampermonkey → **Détails**.

## Attention

Les règles de X interdisent l'automatisation en dehors de leur API officielle. Bloquer des centaines de comptes d'affilée peut provoquer une limite temporaire ou un verrouillage du compte. Le script attend 4 à 8 secondes entre deux profils et s'arrête s'il est redirigé. Si ça arrive, attends quelques heures avant de relancer. Tu l'utilises à tes risques.

## Ce que fait le script

- Il ne tourne que sur `x.com`.
- Il ne contacte que `raw.githubusercontent.com` (la liste) et `blockfacho.readymoss8.chatgpt.site` (si GitHub ne répond pas).
- Il ne lit ni n'envoie aucune donnée de ton compte.

Si X change son interface, le script s'arrête avec un message au lieu de cliquer au hasard.

Code source, liste et signalement de bugs : [github.com/WeaversEpigone/XAutoBlockFarRight](https://github.com/WeaversEpigone/XAutoBlockFarRight). Projet indépendant, sans lien avec X ni avec le site blockfacho.
