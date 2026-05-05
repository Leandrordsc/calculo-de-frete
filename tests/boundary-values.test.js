const assert = require("node:assert/strict");
const http = require("node:http");
const test = require("node:test");
const vm = require("node:vm");

const port = 3159;
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

function assertClose(actual, expected) {
  assert.ok(
    Math.abs(actual - expected) < 0.000001,
    `expected ${actual} to be close to ${expected}`
  );
}

test("valores limite para a regra de adicional por peso", async (t) => {
  const { calculateShipping, server } = await loadCalculationFromRunningApp();
  t.after(() => server.close());

  const cases = [
    {
      name: "imediatamente abaixo de 5 kg nao cobra adicional",
      weight: 4.99,
      expected: { weightCost: 0, expressCost: 0, total: 10 }
    },
    {
      name: "exatamente 5 kg nao cobra adicional",
      weight: 5,
      expected: { weightCost: 0, expressCost: 0, total: 10 }
    },
    {
      name: "imediatamente acima de 5 kg cobra adicional proporcional",
      weight: 5.01,
      expected: { weightCost: 0.02, expressCost: 0, total: 10.02 }
    },
    {
      name: "imediatamente acima de 5 kg com expressa aplica 50 por cento sobre subtotal",
      weight: 5.01,
      deliveryType: "expressa",
      expected: { weightCost: 0.02, expressCost: 5.01, total: 15.03 }
    }
  ];

  for (const testCase of cases) {
    await t.test(testCase.name, () => {
      const actual = calculateShipping(
        testCase.weight,
        "Sul",
        testCase.deliveryType || "normal"
      );

      assert.equal(actual.baseCost, 10);
      assertClose(actual.weightCost, testCase.expected.weightCost);
      assertClose(actual.expressCost, testCase.expected.expressCost);
      assertClose(actual.total, testCase.expected.total);
    });
  }
});
