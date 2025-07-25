# Commands
Local Testing:
```
hugo server -D
# build will be empty if theme isn't present
```

Publish:
```
hugo -D
```
If first time installing make sure to also init submodule too:
```
git submodule init
git submodule update
```

Notes:
* brew install hugo if not available on local
* if theme isn't there due to git submodule, reclone in themes folder
* pushing code now needs a personal access token instead of password, need to request a new one when pushing
