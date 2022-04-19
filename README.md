# kubectl-extra

Works exactly like `kubectl` but with some extra utils

## Installation

```
npm i -g kubectl-extra
```

## Commands

Create shortcut for convenience

```
# somewhere in .bashrc
alias k=kubectl-extra
```

### Get pod logs by fuzzy query
```
k p l <query>
```

### Get decoded secrets by fuzzy query
```
k g c <query>
```

### Get current context
```
k cc
```
