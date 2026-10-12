// SkSL for the AI orb, kept apart from React so it can be compiled and checked on its own.
//
// Uniforms:
//   size      canvas size in pixels (square)
//   time      seconds
//   level     smoothed loudness 0..1 (the caller picks mic or AI voice depending on who is talking)
//   w         blend weights: x = listening/idle, y = user speaking, z = thinking, w = AI speaking
//   modeMix   0 = Affirm palette, 1 = Question palette
export const ORB_SHADER = `
uniform float2 size;
uniform float time;
uniform float level;
uniform float4 w;
uniform float modeMix;

const float TAU = 6.2831853;

half4 main(float2 fragCoord) {
  float2 q = (fragCoord - size * 0.5) / (min(size.x, size.y) * 0.5);
  float r = length(q);
  float a = atan(q.y, q.x);

  float talking = w.y + w.w;

  // Outline wobble: gentle when idle, driven by loudness when someone is speaking
  float wobble = sin(a * 3.0 + time * 1.6) * 0.5
               + sin(a * 5.0 - time * 2.3) * 0.3
               + sin(a * 2.0 + time * 0.9) * 0.4;
  float amp = 0.02 + 0.015 * w.x + 0.03 * w.z + 0.13 * level * talking;
  float breathe = 0.018 * sin(time * 1.2);
  float radius = 0.56 + breathe + 0.09 * level * talking + amp * wobble;

  float d = r - radius;
  float body = 1.0 - smoothstep(-0.012, 0.012, d);
  float depth = clamp(1.0 - r / radius, 0.0, 1.0);

  // Palettes: Affirm is warm lime, Question is cool blue
  float3 innerA = mix(float3(0.831, 0.871, 0.584), float3(0.561, 0.639, 0.780), modeMix);
  float3 edgeB = mix(float3(0.310, 0.360, 0.160), float3(0.180, 0.240, 0.370), modeMix);

  float3 col = mix(edgeB, innerA, pow(depth, 0.55));

  // A soft light that drifts across the surface, faster while thinking
  float spin = time * (0.6 + 1.4 * w.z);
  float2 lightDir = float2(cos(spin), sin(spin)) * 0.28;
  float light = exp(-dot(q - lightDir, q - lightDir) * 5.0);
  col += innerA * light * (0.25 + 0.25 * w.z);

  // Bright rim, stronger while the user is speaking
  float rim = exp(-abs(d) * 18.0) * (0.35 + 0.5 * w.y + 0.25 * level);
  col += innerA * rim * body;

  // Glow outside the body, swelling with loudness
  float glow = exp(-max(d, 0.0) * 5.5) * (0.20 + 0.60 * level * talking + 0.10 * w.x);
  float outside = (1.0 - body) * glow;

  // Rings that spread out while the AI is speaking
  float ring = sin((r - time * 0.55) * 16.0) * 0.5 + 0.5;
  float ringMask = (1.0 - body) * exp(-max(d, 0.0) * 4.0) * w.w * (0.15 + level);
  float rings = ring * ringMask * 0.45;

  float alpha = clamp(body + outside + rings, 0.0, 1.0);
  float3 color = (col * body + innerA * (outside + rings)) ;
  return half4(half3(color), half(alpha));
}
`;
