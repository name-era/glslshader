precision mediump float;
uniform sampler2D codeTextureUnit;
uniform sampler2D noiseTextureUnit;
uniform bool noiseTypeOne;
uniform float noiseStrength;
uniform float vignetteScale;
uniform float sinWave;
uniform float sinStrength;
uniform float time;
uniform vec3 background;

varying vec2 vTexCoord;
const float weight = 0.8;

//乱数生成1
float rnd(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

//乱数生成2
float rnd2(vec2 n) {
    float a = 0.129898;
    float b = 0.78233;
    float c = 437.585453;
    float dt = dot(n, vec2(a, b));
    float sn = mod(dt, 3.14);
    return fract(sin(sn) * c);
}

float median(float r, float g, float b) {
    return max(min(r, g), min(max(r, g), b));
}

void main() {
    vec2 v = vTexCoord * 2.0 - 1.0;
    float vig = vignetteScale - length(v);
    float wave = sin(v.y * sinWave + time * 5.0);
    //値を0～1に修正
    wave = (wave + 1.0) * 0.5;
    wave = 1.0 - wave * sinStrength;

    //ホワイトノイズの生成
    float n = rnd(gl_FragCoord.st + time * 0.001);
    if(noiseTypeOne != true) {
        n = rnd2(gl_FragCoord.st + time * 0.01);
    }
    n = 1.0 - n * noiseStrength;

    //rain
    float coordX = gl_FragCoord.x - mod(gl_FragCoord.x, 32.0);
    float speed = cos(coordX * 3.0) * 0.3 + 0.7;
    float y = fract(vTexCoord.y + time * speed);
    vec3 matrixColor = background / (y * 20.0);

    //code
    vec2 uv = mod(gl_FragCoord.xy, 32.0) / 32.0;
    //1ブロックを計算
    vec2 block = gl_FragCoord.xy / 32.0 - uv;
    vec2 resizedUV = uv * 0.8 + 0.1;
    //ノイズ画像をピクセルで取得
    vec2 squreUV = resizedUV + floor(texture2D(noiseTextureUnit, block / vec2(234, 121) + time * 0.002).xy * 32.0);
    vec2 randomBlock = squreUV / 32.0;
    vec2 texCoord = vec2(randomBlock.x, randomBlock.y);
    //文字を取り出す
    vec4 codeText = texture2D(codeTextureUnit, texCoord);

    //msdf
    float sigDist = median(codeText.r, codeText.g, codeText.b) - 0.5;
    float opacity = clamp(sigDist + 0.5, 0.0, 1.0);
    
    gl_FragColor = vec4(matrixColor * median(codeText.r, codeText.g, codeText.b) * vig * wave * n, 1.0);
}