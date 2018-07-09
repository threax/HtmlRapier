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

"hr.test.*": [
    "node_modules\\htmlrapier\\test\\*"
],

"node_modules\\htmlrapier\\test\\**\\*.ts",