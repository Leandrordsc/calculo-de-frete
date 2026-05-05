const assert = require("node:assert/strict");
const http = require("node:http");
const test = require("node:test");
const vm = require("node:vm");

const port = 3157;
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

function startApplication() {
  process.env.PORT = String(port);
  const server = require("../server");

  return server;
}

async function loadCalculationFromRunningApp() {
  const response = await request("/script.js");
  assert.equal(response.statusCode, 200);

  const form = {
    addEventListener() {}
  };
  const element = {
    textContent: ""
  };
  const context = {
    Intl,
    FormData,
    Number,
    Math,
    document: {
      querySelector(selector) {
        return selector === "#shipping-form" ? form : { ...element };
      }
    }
  };

  vm.createContext(context);
  vm.runInContext(`${response.body}\nthis.calculateShipping = calculateShipping;`, context);

  return context.calculateShipping;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(value);
}

const cases = [
  {
    partition: "Sul-Sudeste / ate 5 kg / entrega expressa falsa",
    region: "Sul",
    weight: 4,
    deliveryType: "normal",
    expected: { baseCost: 10, weightCost: 0, expressCost: 0, total: 10 }
  },
  {
    partition: "Sul-Sudeste / ate 5 kg / entrega expressa verdadeira",
    region: "Sul",
    weight: 4,
    deliveryType: "expressa",
    expected: { baseCost: 10, weightCost: 0, expressCost: 5, total: 15 }
  },
  {
    partition: "Sul-Sudeste / acima de 5 kg / entrega expressa falsa",
    region: "Sul",
    weight: 7,
    deliveryType: "normal",
    expected: { baseCost: 10, weightCost: 4, expressCost: 0, total: 14 }
  },
  {
    partition: "Sul-Sudeste / acima de 5 kg / entrega expressa verdadeira",
    region: "Sul",
    weight: 7,
    deliveryType: "expressa",
    expected: { baseCost: 10, weightCost: 4, expressCost: 7, total: 21 }
  },
  {
    partition: "Centro-Oeste / ate 5 kg / entrega expressa falsa",
    region: "Centro-Oeste",
    weight: 4,
    deliveryType: "normal",
    expected: { baseCost: 15, weightCost: 0, expressCost: 0, total: 15 }
  },
  {
    partition: "Centro-Oeste / ate 5 kg / entrega expressa verdadeira",
    region: "Centro-Oeste",
    weight: 4,
    deliveryType: "expressa",
    expected: { baseCost: 15, weightCost: 0, expressCost: 7.5, total: 22.5 }
  },
  {
    partition: "Centro-Oeste / acima de 5 kg / entrega expressa falsa",
    region: "Centro-Oeste",
    weight: 7,
    deliveryType: "normal",
    expected: { baseCost: 15, weightCost: 4, expressCost: 0, total: 19 }
  },
  {
    partition: "Centro-Oeste / acima de 5 kg / entrega expressa verdadeira",
    region: "Centro-Oeste",
    weight: 7,
    deliveryType: "expressa",
    expected: { baseCost: 15, weightCost: 4, expressCost: 9.5, total: 28.5 }
  },
  {
    partition: "Norte-Nordeste / ate 5 kg / entrega expressa falsa",
    region: "Norte",
    weight: 4,
    deliveryType: "normal",
    expected: { baseCost: 20, weightCost: 0, expressCost: 0, total: 20 }
  },
  {
    partition: "Norte-Nordeste / ate 5 kg / entrega expressa verdadeira",
    region: "Norte",
    weight: 4,
    deliveryType: "expressa",
    expected: { baseCost: 20, weightCost: 0, expressCost: 10, total: 30 }
  },
  {
    partition: "Norte-Nordeste / acima de 5 kg / entrega expressa falsa",
    region: "Norte",
    weight: 7,
    deliveryType: "normal",
    expected: { baseCost: 20, weightCost: 4, expressCost: 0, total: 24 }
  },
  {
    partition: "Norte-Nordeste / acima de 5 kg / entrega expressa verdadeira",
    region: "Norte",
    weight: 7,
    deliveryType: "expressa",
    expected: { baseCost: 20, weightCost: 4, expressCost: 12, total: 36 }
  }
];

test("tabela de decisao para calculo de frete", async (t) => {
  const server = startApplication();
  t.after(() => server.close());

  const calculateShipping = await loadCalculationFromRunningApp();

  for (const testCase of cases) {
    await t.test(testCase.partition, () => {
      const actual = calculateShipping(
        testCase.weight,
        testCase.region,
        testCase.deliveryType
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

      assert.equal(formatCurrency(actual.baseCost), formatCurrency(testCase.expected.baseCost));
      assert.equal(formatCurrency(actual.weightCost), formatCurrency(testCase.expected.weightCost));
      assert.equal(formatCurrency(actual.expressCost), formatCurrency(testCase.expected.expressCost));
      assert.equal(formatCurrency(actual.total), formatCurrency(testCase.expected.total));
    });
  }
});
