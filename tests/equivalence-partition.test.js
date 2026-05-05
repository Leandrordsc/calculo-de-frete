const assert = require("node:assert/strict");
const http = require("node:http");
const test = require("node:test");
const vm = require("node:vm");

const port = 3158;
const baseUrl = `http://127.0.0.1:${port}`;

function request(pathname) {
  return new Promise((resolve, reject) => {
    http
      .get(`${baseUrl}${pathname}`, (response) => {
        let body = "";
        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          body += chunk;
        });
        response.on("end", () => {
          resolve({ statusCode: response.statusCode, body });
        });
      })
      .on("error", reject);
  });
}

async function loadCalculationFromRunningApp() {
  process.env.PORT = String(port);
  const server = require("../server");
  const response = await request("/script.js");
  assert.equal(response.statusCode, 200);

  const context = {
    Intl,
    FormData,
    Number,
    Math,
    document: {
      querySelector(selector) {
        return selector === "#shipping-form"
          ? { addEventListener() {} }
          : { textContent: "" };
      }
    }
  };

  vm.createContext(context);
  vm.runInContext(`${response.body}\nthis.calculateShipping = calculateShipping;`, context);

  return { calculateShipping: context.calculateShipping, server };
}

test("particoes de equivalencia de regiao, peso e entrega", async (t) => {
  const { calculateShipping, server } = await loadCalculationFromRunningApp();
  t.after(() => server.close());

  const cases = [
    {
      name: "Sul pertence a particao Sul-Sudeste",
      input: { region: "Sul", weight: 4, deliveryType: "normal" },
      expected: { baseCost: 10, weightCost: 0, expressCost: 0, total: 10 }
    },
    {
      name: "Sudeste pertence a particao Sul-Sudeste",
      input: { region: "Sudeste", weight: 4, deliveryType: "normal" },
      expected: { baseCost: 10, weightCost: 0, expressCost: 0, total: 10 }
    },
    {
      name: "Centro-Oeste possui particao propria",
      input: { region: "Centro-Oeste", weight: 4, deliveryType: "normal" },
      expected: { baseCost: 15, weightCost: 0, expressCost: 0, total: 15 }
    },
    {
      name: "Norte pertence a particao Norte-Nordeste",
      input: { region: "Norte", weight: 4, deliveryType: "normal" },
      expected: { baseCost: 20, weightCost: 0, expressCost: 0, total: 20 }
    },
    {
      name: "Nordeste pertence a particao Norte-Nordeste",
      input: { region: "Nordeste", weight: 4, deliveryType: "normal" },
      expected: { baseCost: 20, weightCost: 0, expressCost: 0, total: 20 }
    },
    {
      name: "peso ate 5 kg nao gera adicional",
      input: { region: "Sul", weight: 3, deliveryType: "normal" },
      expected: { baseCost: 10, weightCost: 0, expressCost: 0, total: 10 }
    },
    {
      name: "peso acima de 5 kg gera adicional",
      input: { region: "Sul", weight: 8, deliveryType: "normal" },
      expected: { baseCost: 10, weightCost: 6, expressCost: 0, total: 16 }
    },
    {
      name: "entrega normal nao gera acrescimo",
      input: { region: "Centro-Oeste", weight: 8, deliveryType: "normal" },
      expected: { baseCost: 15, weightCost: 6, expressCost: 0, total: 21 }
    },
    {
      name: "entrega expressa gera acrescimo de 50 por cento",
      input: { region: "Centro-Oeste", weight: 8, deliveryType: "expressa" },
      expected: { baseCost: 15, weightCost: 6, expressCost: 10.5, total: 31.5 }
    }
  ];

  for (const testCase of cases) {
    await t.test(testCase.name, () => {
      const actual = calculateShipping(
        testCase.input.weight,
        testCase.input.region,
        testCase.input.deliveryType
      );

      assert.deepEqual(
        {
          baseCost: actual.baseCost,
          weightCost: actual.weightCost,
          expressCost: actual.expressCost,
          total: actual.total
        },
        testCase.expected
      );
    });
  }
});
