import { createServer as createHttpServer } from "node:http";
import { appendFile, readFile, stat } from "node:fs/promises";
import { dirname, extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import nodemailer from "nodemailer";

const ROOT = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(ROOT, "public");
const DATA_FILE = process.env.DATA_FILE || join(ROOT, "data", "requests.jsonl");
const REQUEST_EMAIL = "dungocanh061003@gmail.com";
const MAX_BODY_BYTES = 16_384;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 10;

const SERVICES = [
  {
    id: "computer-repair",
    number: "01",
    title: "Sửa chữa máy tính",
    description:
      "Chẩn đoán và khắc phục sự cố máy tính, laptop nhanh chóng, minh bạch chi phí.",
    icon: "computer",
    tags: ["PC & laptop", "Phần cứng", "Phần mềm"]
  },
  {
    id: "computer-installation",
    number: "02",
    title: "Lắp đặt máy tính",
    description:
      "Tư vấn cấu hình, lắp ráp PC và cài đặt thiết bị theo đúng nhu cầu sử dụng.",
    icon: "monitor",
    tags: ["Lắp ráp PC", "Cài đặt", "Nâng cấp"]
  },
  {
    id: "network-infrastructure",
    number: "03",
    title: "Hạ tầng mạng",
    description:
      "Thiết kế, thi công mạng nội bộ ổn định cho văn phòng, cửa hàng và gia đình.",
    icon: "network",
    tags: ["Wi-Fi", "LAN", "Tủ mạng"]
  },
  {
    id: "security-camera",
    number: "04",
    title: "Camera an ninh",
    description:
      "Lắp đặt camera theo khu vực, xem từ xa dễ dàng và hỗ trợ bảo trì định kỳ.",
    icon: "camera",
    tags: ["Tư vấn vị trí", "Lắp đặt", "Bảo trì"]
  },
  {
    id: "it-maintenance",
    number: "05",
    title: "Bảo trì thiết bị",
    description:
      "Kiểm tra định kỳ, vệ sinh thiết bị và chủ động phát hiện rủi ro vận hành.",
    icon: "tool",
    tags: ["Định kỳ", "Tận nơi", "Doanh nghiệp"]
  },
  {
    id: "it-consulting",
    number: "06",
    title: "Tư vấn giải pháp IT",
    description:
      "Đề xuất thiết bị và giải pháp công nghệ phù hợp với quy mô và ngân sách.",
    icon: "spark",
    tags: ["Khảo sát", "Báo giá", "Đồng hành"]
  }
];

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml"
};

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
    "X-Content-Type-Options": "nosniff"
  });
  response.end(JSON.stringify(payload));
}

async function readJsonBody(request) {
  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (Buffer.byteLength(body) > MAX_BODY_BYTES) {
      const error = new Error("Request body is too large.");
      error.statusCode = 413;
      throw error;
    }
  }

  try {
    return JSON.parse(body);
  } catch {
    const error = new Error("Request body must be valid JSON.");
    error.statusCode = 400;
    throw error;
  }
}

function validateRequest(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { error: "Dữ liệu gửi lên không hợp lệ." };
  }

  const name = typeof input.name === "string" ? input.name.trim() : "";
  const phone = typeof input.phone === "string" ? input.phone.trim() : "";
  const serviceId =
    typeof input.serviceId === "string" ? input.serviceId.trim() : "";
  const message =
    typeof input.message === "string" ? input.message.trim() : "";
  const email =
    typeof input.email === "string" ? input.email.trim() : "";

  if (name.length < 2 || name.length > 100) {
    return { error: "Vui lòng nhập họ tên từ 2 đến 100 ký tự." };
  }

  if (!/^[+()\d.\-\s]{8,20}$/.test(phone) || phone.replace(/\D/g, "").length < 8) {
    return { error: "Số điện thoại chưa đúng định dạng." };
  }

  if (!SERVICES.some((service) => service.id === serviceId)) {
    return { error: "Vui lòng chọn dịch vụ cần tư vấn." };
  }

  if (email && (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
    return { error: "Địa chỉ email chưa đúng định dạng." };
  }

  if (message.length > 2000) {
    return { error: "Mô tả yêu cầu không được vượt quá 2.000 ký tự." };
  }

  return {
    value: {
      id: crypto.randomUUID(),
      name,
      phone,
      email,
      serviceId,
      message,
      createdAt: new Date().toISOString()
    }
  };
}

function escapeHtml(value) {
  const entities = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  };
  return String(value).replace(/[&<>"']/g, (character) => entities[character]);
}

function createRequestMailer() {
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_APP_PASSWORD;

  if (!user || !password) {
    return async () => {
      const error = new Error("SMTP_USER and SMTP_APP_PASSWORD are required.");
      error.statusCode = 503;
      throw error;
    };
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass: password },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000
  });

  return async (request) => {
    const service = SERVICES.find(({ id }) => id === request.serviceId);
    const details = [
      ["Mã yêu cầu", request.id],
      ["Dịch vụ", service.title],
      ["Họ và tên", request.name],
      ["Số điện thoại", request.phone],
      ["Email khách hàng", request.email || "Không cung cấp"],
      ["Thời gian gửi", request.createdAt],
      ["Mô tả nhu cầu", request.message || "Không cung cấp"]
    ];

    await transporter.sendMail({
      from: { name: "Minh Tín Tech", address: user },
      to: REQUEST_EMAIL,
      replyTo: request.email || undefined,
      subject: `[KIUTECH] Yêu cầu tư vấn - ${service.title}`,
      text: details.map(([label, value]) => `${label}: ${value}`).join("\n"),
      html: `<h2>Yêu cầu tư vấn dịch vụ mới</h2><table>${details
        .map(
          ([label, value]) =>
            `<tr><th align="left" style="padding:6px 12px 6px 0">${escapeHtml(label)}</th><td style="padding:6px 0">${escapeHtml(value)}</td></tr>`
        )
        .join("")}</table>`
    });
  };
}

function createRateLimiter() {
  const requests = new Map();

  return (key) => {
    const now = Date.now();
    const recent = (requests.get(key) || []).filter(
      (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS
    );

    if (recent.length >= RATE_LIMIT_MAX_REQUESTS) {
      requests.set(key, recent);
      return false;
    }

    recent.push(now);
    requests.set(key, recent);
    return true;
  };
}

async function serveStatic(pathname, response) {
  let decodedPath;
  try {
    decodedPath = decodeURIComponent(pathname);
  } catch {
    sendJson(response, 400, { error: "Đường dẫn không hợp lệ." });
    return;
  }

  const relativePath = decodedPath === "/" ? "index.html" : decodedPath.slice(1);
  const filePath = resolve(PUBLIC_DIR, normalize(relativePath));
  if (filePath !== PUBLIC_DIR && !filePath.startsWith(PUBLIC_DIR + sep)) {
    sendJson(response, 403, { error: "Không được phép truy cập đường dẫn này." });
    return;
  }

  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) {
      sendJson(response, 404, { error: "Không tìm thấy trang." });
      return;
    }

    const content = await readFile(filePath);
    response.writeHead(200, {
      "Cache-Control": "no-cache",
      "Content-Length": content.length,
      "Content-Type":
        MIME_TYPES[extname(filePath).toLowerCase()] || "application/octet-stream",
      "X-Content-Type-Options": "nosniff"
    });
    response.end(content);
  } catch (error) {
    if (error.code === "ENOENT") {
      sendJson(response, 404, { error: "Không tìm thấy trang." });
      return;
    }
    throw error;
  }
}

export function createApp({
  dataFile = DATA_FILE,
  sendEmail = createRequestMailer()
} = {}) {
  const allowRequest = createRateLimiter();

  return createHttpServer(async (request, response) => {
    const url = new URL(request.url, "http://localhost");

    if (request.method === "GET" && url.pathname === "/api/services") {
      sendJson(response, 200, { services: SERVICES });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/requests") {
      const clientKey = request.socket.remoteAddress || "unknown";
      if (!allowRequest(clientKey)) {
        sendJson(response, 429, {
          error: "Đã có quá nhiều yêu cầu. Vui lòng thử lại sau ít phút."
        });
        return;
      }

      const contentType = request.headers["content-type"] || "";
      if (!contentType.toLowerCase().includes("application/json")) {
        sendJson(response, 415, {
          error: "Yêu cầu cần được gửi dưới dạng JSON."
        });
        return;
      }

      try {
        const body = await readJsonBody(request);
        const result = validateRequest(body);
        if (result.error) {
          sendJson(response, 400, { error: result.error });
          return;
        }

        await appendFile(dataFile, `${JSON.stringify(result.value)}\n`, {
          encoding: "utf8",
          flag: "a"
        });
        try {
          await sendEmail(result.value);
        } catch (error) {
          const statusCode = error.statusCode === 503 ? 503 : 502;
          console.error(
            "Could not email service request:",
            error.code || "SMTP delivery failed"
          );
          sendJson(response, statusCode, {
            error:
              statusCode === 503
                ? "Hệ thống chưa được cấu hình email. Yêu cầu đã lưu nhưng chưa gửi được."
                : "Yêu cầu đã lưu nhưng chưa gửi được email. Vui lòng thử lại sau."
          });
          return;
        }

        sendJson(response, 201, {
          message: "Đã nhận yêu cầu. Chúng tôi sẽ liên hệ với bạn sớm.",
          requestId: result.value.id
        });
      } catch (error) {
        if (error.statusCode) {
          sendJson(response, error.statusCode, { error: error.message });
          return;
        }
        console.error("Could not save service request:", error);
        sendJson(response, 500, {
          error: "Chưa thể lưu yêu cầu lúc này. Vui lòng thử lại sau."
        });
      }
      return;
    }

    if (url.pathname.startsWith("/api/")) {
      sendJson(response, 404, { error: "Không tìm thấy API." });
      return;
    }

    if (request.method !== "GET" && request.method !== "HEAD") {
      sendJson(response, 405, { error: "Phương thức không được hỗ trợ." });
      return;
    }

    try {
      if (request.method === "HEAD") {
        const headResponse = {
          writeHead(statusCode, headers) {
            response.writeHead(statusCode, headers);
          },
          end() {
            response.end();
          }
        };
        await serveStatic(url.pathname, headResponse);
      } else {
        await serveStatic(url.pathname, response);
      }
    } catch (error) {
      console.error("Could not serve requested file:", error);
      if (!response.headersSent) {
        sendJson(response, 500, { error: "Không thể tải nội dung trang." });
      } else {
        response.destroy(error);
      }
    }
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const server = createApp();
  const port = Number(process.env.PORT) || 3000;
  server.listen(port, () => {
    console.log(`Minh Tín Tech is running at http://localhost:${port}`);
  });
}
