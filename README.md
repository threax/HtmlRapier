# HtmlRapier
A tiny mvc library for building web apps using rest apis.

Visit https://threax.github.io/HtmlRapierDocs/ for more information.

# Testing
To run the tests yarn link this library into a hypermedia project.

Add the following to artifacts.json:

  {
    "pathBase": "./node_modules/htmlrapier/testPages",
    "outDir": "test/htmlrapier",
    "copy": [
      "./node_modules/htmlrapier/testPages/*"
    ]
  }

And the following to tsconfig.json:

under "paths"

"hr.test.*": [
    "node_modules\\htmlrapier\\test\\*"
],

under "include"

"node_modules\\htmlrapier\\test\\**\\*.ts",

visit https://projecturl/test/htmlrapier/unittests.html to test.

# Building Components from HTML
You can use the htmlrapier-compile project to build typescript component definitions from html files.