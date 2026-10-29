# Blockfacho auto-block (X)

Bloque automatiquement sur X les comptes de la liste de ce dépôt, reprise de [blockfacho](https://onbloquelextremedroite.fun/), depuis ton navigateur, avec ton compte.

- **Aucun mot de passe, aucun token.** Le script clique sur le vrai bouton « Bloquer » de X, dans ta session.
- **1 396 comptes X.** La liste vient de ce dépôt ; elle est figée au 28/10/2026 (voir plus bas).
- **Reprend où tu t'es arrêté.** Les comptes déjà bloqués sont sautés, et les nouveaux arrivent à la fin.

## Installer (2 min)

1. Installe [Tampermonkey](https://www.tampermonkey.net/).
2. Chrome seulement : `chrome://extensions` → Tampermonkey → **Détails** → active **Autoriser les scripts utilisateur**.
3. Clique ici : **[installer le script](https://raw.githubusercontent.com/WeaversEpigone/XAutoBlockFarRight/main/blockfacho-x.user.js)**. Tampermonkey propose de l'installer, puis le met à jour tout seul depuis l'endroit où tu l'as installé.

## Utiliser

Sur [x.com](https://x.com), connecté, un panneau apparaît en bas à droite.

1. **Charger la liste**, puis ouvre « Voir les comptes » pour vérifier.
2. **Démarrer**. Ça tourne jusqu'à la fin de la liste ou jusqu'à **Stop**.

Pour essayer sans rien bloquer : coche **Test** avant **Démarrer**, le script vérifie 3 profils puis s'arrête.

| Besoin | Que faire |
| --- | --- |
| La liste a changé | **Charger la liste** puis **Démarrer** : seuls les nouveaux comptes restent à faire. |
| Changer de navigateur ou d'ordi | Note le « Dernier bloqué : n° X » et mets X + 1 dans **Commencer à**. |
| Reprendre à partir d'un compte précis | Tape son `@` (ou colle le lien du profil) dans **Commencer à**. |
| Reprendre après un arrêt | **Démarrer** suffit, rien n'est refait. |
| Tout recommencer | **Remettre à zéro** oublie les comptes faits (ça ne débloque personne). |

> [!WARNING]
> X interdit l'automatisation hors de son API. Bloquer des centaines de comptes d'affilée peut provoquer une limite temporaire ou un verrouillage du compte. Si le script s'arrête avec un message de redirection ou de limite, attends quelques heures avant de relancer. Tu l'utilises à tes risques.

## La liste dans ce dépôt

[`list/x.json`](list/x.json) (et [`list/x.txt`](list/x.txt), un @ par ligne) est la liste que le script charge.

> [!NOTE]
> **Liste figée au 28/10/2026.** Le site blockfacho ne publie plus sa liste complète : il distribue désormais les profils au compte-gouttes, derrière une vérification anti-robot. La liste de ce dépôt n'est donc plus mise à jour automatiquement. Elle le sera de nouveau si le site propose un export officiel.

L'historique des commits montre qui a été ajouté ou retiré, et quand.

## Si ça casse

X change parfois son interface. Le script s'arrête alors avec un message au lieu de cliquer au hasard. Ouvre une issue avec ce message, ou corrige les sélecteurs `SEL` en haut du script.

## Développer

```bash
node scripts/test.js   # vérifie list/ et la logique du panneau
```

Pour modifier la liste : édite `list/x.json` et `list/x.txt` ensemble, lance le test, puis commit.

Licence [MIT](LICENSE). Projet indépendant, sans lien avec X ni avec le site blockfacho.
