git remote add origin https://github.com/viralkgh7/Split-Mate.git
git add src/theme.ts src/types/
git commit -m "feat: setup app styling and typescript types"

git add src/firebaseConfig.ts src/context/ src/hooks/
git commit -m "feat: integrate firebase, auth context, and custom hooks"

git add src/components/
git commit -m "feat: build reusable UI components"

git add src/utils/
git commit -m "feat: implement core utility and helper functions"

git add src/screens/
git commit -m "feat: implement feature screens (expenses, settle up, profile, camera)"

git add src/navigation/
git commit -m "feat: setup application routing and navigation structure"

git add assets/ tsc_output.txt
git commit -m "chore: add remaining assets and build outputs"

git branch -M main
git push -u origin main
