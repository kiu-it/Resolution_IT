import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, test } from "node:test";
import vercelHandler, { createApp, createRequestMailer } from "../server.js";

let server;
let dataDirectory;
let baseUrl;
let dataFile;
let sentRequests;
let deliverEmail;

beforeEach(async () => {
  dataDirectory = await mkdtemp(join(tmpdir(), "minh-tin-tech-"));
  dataFile = join(dataDirectory, "nested", "requests.jsonl");
  sentRequests = [];
  deliverEmail = async (request) => sentRequests.push(request);
  server = createApp({
    dataFile,
    sendEmail: (request) => deliverEmail(request)
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

afterEach(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  await rm(dataDirectory, { recursive: true, force: true });
});

test("serves the responsive landing page", async () => {
  const response = await fetch(baseUrl);
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /text\/html/);
  assert.match(html, /Công nghệ vững vàng/);
  assert.match(html, /id="contact-form"/);
  assert.match(html, /name="email"[^>]*required/);
});

test("returns the available services", async () => {
  const response = await fetch(`${baseUrl}/api/services`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.services.length, 6);
  assert.ok(body.services.some((service) => service.id === "security-camera"));
});

test("exports a Vercel-compatible handler for API requests", async () => {
  const response = await new Promise((resolve) => {
    const result = { headers: {} };
    vercelHandler(
      { method: "GET", url: "/api/services", headers: {} },
      {
        writeHead(statusCode, headers) {
          result.statusCode = statusCode;
          result.headers = headers;
        },
        end(body) {
          result.body = JSON.parse(body);
          resolve(result);
        }
      }
    );
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.services.length, 6);
});

test("validates and stores a service request", async () => {
  const response = await fetch(`${baseUrl}/api/requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Nguyễn Minh",
      phone: "0901 234 567",
      email: "minh@example.com",
      serviceId: "network-infrastructure",
      message: "Cần khảo sát mạng văn phòng."
    })
  });
  const body = await response.json();
  const saved = JSON.parse((await readFile(dataFile, "utf8")).trim());

  assert.equal(response.status, 201);
  assert.ok(body.requestId);
  assert.equal(saved.id, body.requestId);
  assert.equal(saved.serviceId, "network-infrastructure");
  assert.equal(saved.name, "Nguyễn Minh");
  assert.equal(sentRequests.length, 1);
  assert.equal(sentRequests[0].email, "minh@example.com");
  assert.equal(sentRequests[0].phone, "0901 234 567");
  assert.equal(sentRequests[0].message, "Cần khảo sát mạng văn phòng.");
});

test("sends the request email to the recipient and the sender", async () => {
  let transportOptions;
  let mailOptions;
  const sendMail = createRequestMailer({
    user: "sender@example.com",
    password: "test-password",
    createTransport: (options) => {
      transportOptions = options;
      return {
        sendMail: async (options) => {
          mailOptions = options;
        }
      };
    }
  });

  await sendMail({
    id: "request-1",
    name: "Nguyễn Minh",
    phone: "0901 234 567",
    email: "minh@example.com",
    serviceId: "network-infrastructure",
    message: "Cần khảo sát mạng văn phòng.",
    createdAt: "2026-11-12T00:00:00.000Z"
  });

  assert.equal(transportOptions.service, "gmail");
  assert.equal(transportOptions.auth.user, "sender@example.com");
  assert.equal(transportOptions.auth.pass, "test-password");
  assert.equal(mailOptions.from.name, "Website");
  assert.equal(mailOptions.to, "dungocanh061003@gmail.com");
  assert.equal(mailOptions.cc, "minh@example.com");
  assert.equal(mailOptions.replyTo, "minh@example.com");
  assert.match(mailOptions.subject, /Yêu cầu mới #request-1 - Hạ tầng mạng/);
  assert.match(mailOptions.text, /Họ tên: Nguyễn Minh/);
  assert.match(mailOptions.text, /SĐT: 0901 234 567/);
  assert.match(mailOptions.text, /Cần khảo sát mạng văn phòng/);
});

test("retries a transient email delivery failure", async () => {
  let attempts = 0;
  deliverEmail = async (request) => {
    attempts += 1;
    if (attempts === 1) {
      const error = new Error("SMTP connection failed");
      error.code = "ECONNECTION";
      throw error;
    }
    sentRequests.push(request);
  };

  const response = await fetch(`${baseUrl}/api/requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Nguyễn Minh",
      phone: "0901 234 567",
      email: "minh@example.com",
      serviceId: "network-infrastructure",
      message: "Cần khảo sát mạng văn phòng."
    })
  });

  assert.equal(response.status, 201);
  assert.equal(attempts, 2);
  assert.equal(sentRequests.length, 1);
});

test("reports an email delivery failure without claiming success", async () => {
  let attempts = 0;
  deliverEmail = async () => {
    attempts += 1;
    const error = new Error("SMTP connection failed");
    error.code = "ECONNECTION";
    throw error;
  };

  const response = await fetch(`${baseUrl}/api/requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Nguyễn Minh",
      phone: "0901 234 567",
      email: "minh@example.com",
      serviceId: "network-infrastructure",
      message: "Cần khảo sát mạng văn phòng."
    })
  });
  const body = await response.json();

  assert.equal(response.status, 502);
  assert.match(body.error, /chưa gửi được email/);
  assert.equal(attempts, 3);
  assert.equal((await readFile(dataFile, "utf8")).trim().length > 0, true);
});

test("requires an email address so the sender receives a copy", async () => {
  const response = await fetch(`${baseUrl}/api/requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Nguyễn Minh",
      phone: "0901 234 567",
      serviceId: "network-infrastructure"
    })
  });

  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /địa chỉ email/i);
});

test("rejects malformed or incomplete service requests", async () => {
  const response = await fetch(`${baseUrl}/api/requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "A",
      phone: "not-a-phone",
      serviceId: "unknown-service"
    })
  });

  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /họ tên/);
});

test("rejects request bodies that are not JSON", async () => {
  const response = await fetch(`${baseUrl}/api/requests`, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: "hello"
  });

  assert.equal(response.status, 415);
});
