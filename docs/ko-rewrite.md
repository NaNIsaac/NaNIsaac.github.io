# Korean copy rewrite (SITE-KO1)

Every `data-ko` string on the site, with the English it stands beside, the Korean before this change and after it.
Tags inside a string are dropped for reading; `/` marks a line break. Rows marked `=` did not change.

## index.html

| English | Old Korean | New Korean |
|---|---|---|
| Isaac Yong | 용이삭 | = |
| Work | 작업 | = |
| Notes | 노트 | = |
| Lab | 랩 | 실험 |
| Tools | 도구 | 계산기 |
| Contact | 연락 | = |
| Open the lab → | 랩 열기 → | 직접 해 보기 → |
| Move or click to make ripples. | 움직이거나 클릭하면 물결이 생깁니다. | 마우스를 움직이거나 누르면 물결이 일어납니다. |
| Tap to make ripples. | 탭하면 물결이 생깁니다. | 화면을 누르면 물결이 일어납니다. |
| From scattered waves | 흩어진 파동에서 | X선이 남긴 무늬로 |
| to structure. | 구조로. | 구조를 읽습니다. |
| I'm Isaac Yong. I work with X-rays, diffraction and computation, from how waves scatter to what we can learn from them. | 용이삭입니다. X선과 회절, 그리고 계산을 다룹니다. 파동이 어떻게 흩어지는지부터, 거기서 무엇을 알아낼 수 있는지까지. | 용이삭입니다. X선 산란과 회절을 공부하고, 측정한 데이터를 코드로 풉니다. |
| See the work | 작업 보기 | = |
| MS student in Physics at Sogang University, CUPT Lab. The measurements happen at synchrotron and XFEL beamlines; most of the work happens after them, in code. | 서강대학교 물리학과 석사과정, CUPT Lab. 측정은 방사광가속기와 XFEL 빔라인에서 하고, 일의 대부분은 그 뒤에 코드로 합니다. | 서강대학교 물리학과 석사과정, CUPT Lab 소속입니다. 방사광가속기와 XFEL에서 측정하는 시간은 짧고, 그 데이터를 코드로 푸는 시간이 깁니다. |
| Scattering and crystals. What a lattice or a thin film does to an X-ray beam: Bragg and Laue diffraction, reflectivity, and acoustic Bragg satellites forming in dynamical diffraction. TraTT | **산란과 결정.** 격자나 박막이 X선에 무엇을 하는가. Bragg·Laue 회절, 반사율, 그리고 동역학적 회절에서 음향 Bragg 위성 피크가 생기는 과정. TraTT | **산란과 결정** 결정과 박막이 X선을 어떻게 흩뜨리는지 봅니다. Bragg·Laue 회절과 반사율, 동역학 회절 속 음향 위성 피크까지 다룹니다. TraTT |
| Signals and phase. A detector records intensity and loses the phase. Fourier analysis, filtering and phase retrieval get it back as far as the physics allows. QoraPhase | **신호와 위상.** 검출기는 세기를 기록하고 위상을 잃습니다. 푸리에 해석, 필터링, 위상 복원으로 물리가 허락하는 만큼 되찾습니다. QoraPhase | **신호와 위상** 검출기는 세기만 기록하고 위상은 기록하지 못합니다. 푸리에 해석, 필터링, 위상 복원으로 그 위상을 되살립니다. 측정에 남은 정보만큼만 가능합니다. QoraPhase |
| Images and inverse problems. From R(q) back to thickness, roughness and SLD; from detector frames to Dark-Field X-ray Microscopy images. ReflectoLearn, QoraDFXM | **이미지와 역문제.** R(q)에서 두께·거칠기·SLD로, 검출기 프레임에서 Dark-Field X-ray Microscopy 영상으로 거슬러 갑니다. ReflectoLearn, QoraDFXM | **이미지와 역문제** 반사율 곡선 R(q)에서 박막의 두께, 거칠기, SLD를 구합니다. 검출기 프레임에서 Dark-Field X-ray Microscopy 영상을 얻습니다. ReflectoLearn, QoraDFXM |
| Tools. Pipelines for time-resolved XFEL data, and calculators that run on the old machines next to the beamline. QoraFlow, calculators | **도구.** XFEL 시간분해 데이터 파이프라인, 그리고 빔라인 옆 오래된 컴퓨터에서도 돌아가는 계산기. QoraFlow, 계산기 | **도구** XFEL 시간분해 데이터 파이프라인을 만듭니다. 빔라인 옆 오래된 PC에서 돌아가는 계산기도 만들었습니다. QoraFlow, 계산기 |
| Talking about neural-network XRR fitting at the Spring 2025 CUPT Workshop. | 2025 봄 CUPT 워크숍, 신경망으로 XRR 피팅하기 발표. | 2025년 봄 CUPT 워크숍에서 신경망 XRR 피팅을 발표했습니다. |
| What I built to do it | 그걸 하려고 만든 것들 | 그래서 만든 것들 |
| Turning raw time-resolved XFEL runs into clean, comparable data. | XFEL 시간분해 측정을 깨끗하고 비교 가능한 데이터로. | XFEL 시간분해 측정 원본을 서로 비교할 수 있는 데이터로 정리합니다. |
| A toolkit for ultrafast pump-probe experiments at X-ray free-electron lasers, refactored from the lab's legacy XFEL_data system by @paulpeterkim. | X선 자유전자레이저의 초고속 pump-probe 실험용 툴킷. 연구실의 레거시 XFEL_data(@paulpeterkim)를 바탕으로 재구성했습니다. | X선 자유전자레이저의 초고속 pump-probe 실험용 툴킷입니다. 연구실에서 쓰던 XFEL_data(@paulpeterkim)를 바탕으로 새로 짰습니다. |
| Reading film thickness, roughness and SLD straight from a reflectivity curve. | 반사율 곡선에서 바로 두께, 거칠기, SLD 읽기. | 반사율 곡선 하나로 박막의 두께, 거칠기, SLD를 바로 읽습니다. |
| A differentiable Abeles transfer-matrix simulator makes training curves on the fly, with Poisson noise, resolution smearing and beam footprint; a 1D CNN predicts the parameters. No dataset files needed. | 미분 가능한 Abeles 전달행렬 시뮬레이터가 노이즈, 분해능, footprint까지 반영한 학습 곡선을 즉석에서 만들고, 1D CNN이 파라미터를 예측합니다. | 학습용 곡선은 미분 가능한 Abeles 전달행렬 시뮬레이터가 그때그때 만듭니다. Poisson 노이즈, 분해능, 빔 footprint까지 넣고, 1D CNN이 파라미터를 예측합니다. 데이터셋 파일은 필요 없습니다. |
| Recovering real-space objects from coherent diffraction patterns. | coherent 회절 패턴에서 실공간 물체 되찾기. | coherent 회절 패턴에서 실공간 물체를 되찾습니다. |
| A composable, JAX-native phase-retrieval framework for CDI, with origin, mask and support conventions written into the API contract. | JAX 기반의 조합형 위상 복원 프레임워크. 원점, 마스크, support 규약을 API 계약으로 명시했습니다. | JAX로 만든 CDI 위상 복원 프레임워크입니다. 알고리즘을 부품처럼 조합해 씁니다. 원점, 마스크, support 규약은 API 계약에 적어 두었습니다. |
| Following how acoustic Bragg satellites form after a laser pulse. | 레이저 펄스 뒤 음향 Bragg 위성 피크가 생기는 과정 따라가기. | 레이저 펄스 뒤 음향 위성 피크가 자라는 과정을 따라갑니다. |
| A transient dynamical-diffraction solver, checked against analytic ground truth in its tests. | 과도 동역학 회절 솔버. 해석해와 비교하는 테스트로 검증합니다. | 과도 동역학 회절 솔버입니다. 테스트에서 해석해와 맞춰 검증합니다. |
| Getting beamline numbers on a control-room PC with no internet. | 인터넷 없는 제어실 PC에서 빔라인 숫자 얻기. | 인터넷이 안 되는 제어실 PC에서도 빔라인 계산을 합니다. |
| Offline X-ray calculators and a beamtime logbook. No server and no runtime fetches, written in ES5 so it runs on the CentOS 7 default browser, Firefox 60 ESR, in the hutch. | 오프라인 X선 계산기와 빔타임 기록 도구. 서버도 외부 요청도 없고, hutch의 CentOS 7 기본 브라우저(Firefox 60 ESR)에서도 돌도록 ES5로 썼습니다. | 오프라인 X선 계산기와 빔타임 기록장입니다. 서버도 외부 요청도 없습니다. hutch의 CentOS 7 기본 브라우저(Firefox 60 ESR)에서도 돌도록 ES5로 썼습니다. |
| Smaller projects | 작은 프로젝트 | = |
| DFXM detector-image analysis: a pure Python engine, a headless CLI and a desktop app. | DFXM 디텍터 영상 분석. 순수 Python 엔진, CLI, 데스크톱 앱. | DFXM 검출기 영상을 분석합니다. 순수 Python 엔진에 CLI와 데스크톱 앱이 붙어 있습니다. |
| A command-line tool that packs codebase context for LLMs. | LLM에 넘길 코드베이스 컨텍스트를 만드는 CLI. | 코드베이스를 LLM에 넘기기 좋게 묶어 주는 CLI입니다. |
| Rectangular region-of-interest helper for detector images. | 영상의 사각형 관심 영역을 다루는 모듈. | 검출기 영상에서 사각형 관심 영역(ROI)을 다루는 모듈입니다. |
| Beamline calculators | 빔라인 계산기 | = |
| Beamtime at the 9C Coherent beamline, Pohang Light Source. | 포항가속기연구소 9C Coherent 빔라인 제어실에서의 빔타임. | 빔타임 중인 포항가속기연구소 9C Coherent 빔라인 제어실. |
| Each satellite grows on its own clock. | 위성 피크는 각자의 시계로 자랍니다. | 위성 피크는 차수마다 다른 속도로 자랍니다. |
| When a laser pulse launches an acoustic wave into a crystal, the X-ray rocking curve grows satellite peaks. The steady state is textbook; how the satellites form while the wavefront crosses the crystal is not. TraTT solves it with two-beam Takagi–Taupin dynamical diffraction and finds that satellite n keeps time by the depth the wave has filled: sin² in Laue, tanh² in Bragg, with no fitted parameter. Poster P2.17 at the KPS 2026 Fall Meeting. | 레이저 펄스가 결정에 음향파를 보내면 X선 rocking curve에 위성 피크가 생깁니다. 정상 상태는 교과서에 있지만, 파면이 결정을 지나는 동안 위성이 어떻게 자라는지는 아닙니다. TraTT는 그 과정을 2빔 Takagi–Taupin 동역학 회절로 풀고, n차 위성이 음향파가 채운 깊이를 시계로 삼는다는 것을 보였습니다. Laue에서는 sin², Bragg에서는 tanh², 맞춘 변수 없이. KPS 2026 가을 학술대회 포스터 P2.17. | 레이저 펄스가 결정 안에 음향파를 만들면 X선 rocking curve에 위성 피크가 생깁니다. 다 자란 뒤의 모양은 교과서에 있지만, 자라는 과정은 없습니다. TraTT는 음향파가 결정을 지나는 동안을 2빔 Takagi–Taupin 동역학 회절로 풉니다. n차 위성은 음향파가 채운 깊이에 따라 자랍니다. Laue 배치에서는 sin², Bragg 배치에서는 tanh²를 따르고, 맞춘 변수는 없습니다. KPS 2026 가을 학술대회 포스터 P2.17. |
| Full Takagi–Taupin simulations for four drive settings (points) against the closed forms (line). Simulated; redrawn from TraTT's poster figure script. | 네 가지 구동 조건의 전체 Takagi–Taupin 계산(점)과 닫힌 식(선). 시뮬레이션이며, TraTT 포스터 그림 스크립트로 다시 그렸습니다. | 점은 네 가지 구동 조건에서 Takagi–Taupin 방정식을 그대로 푼 값, 선은 닫힌 식입니다. 측정이 아닌 시뮬레이션이며, TraTT 포스터의 그림 스크립트로 다시 그렸습니다. |
| Simulated BCDI, not measured: a rocking scan of a strained 350 nm particle (61 frames, photon noise) reconstructed by QoraPhase 0.2.0 (main ef6aa3a) with no support given. Amplitude above, phase (lattice displacement) below, on three cuts of the detector grid; final phase error 0.14 rad against the truth. | 측정이 아닌 시뮬레이션 BCDI입니다. 변형된 350 nm 입자의 rocking scan(61장, 광자 노이즈 포함)을 QoraPhase 0.2.0(main ef6aa3a)이 support 없이 복원합니다. 위는 진폭, 아래는 위상(격자 변위)이고 detector 격자의 세 단면입니다. 마지막 위상 오차는 정답 대비 0.14 rad입니다. | 측정이 아닌 시뮬레이션 BCDI입니다. 변형된 350 nm 입자의 rocking scan(61장, 광자 노이즈 포함)을 QoraPhase 0.2.0(main ef6aa3a)으로 support 없이 복원했습니다. 위는 진폭, 아래는 위상(격자 변위)이고, 검출기 격자를 세 방향으로 자른 단면입니다. 최종 위상 오차는 정답과 비교해 0.14 rad입니다. |
| The detector keeps \|F\|² and loses the phase. | 검출기는 세기만 남기고 위상을 잃습니다. | 세기만 남고, 위상은 사라집니다. |
| Coherent diffraction records only the intensity of the far field. QoraPhase, a JAX phase-retrieval framework for CDI and Bragg CDI, recovers the complex object from that intensity alone: here the run that four random starts agree on most, with the support found from the data. In Bragg CDI the recovered phase maps the lattice displacement inside a nanocrystal. | coherent 회절은 원거리 장의 세기만 기록합니다. JAX로 만든 CDI·Bragg CDI 위상 복원 프레임워크 QoraPhase는 그 세기만으로 복소 물체를 되찾습니다. 여기서는 무작위 시작 4번이 가장 많이 동의하는 결과이고, support도 데이터에서 찾았습니다. Bragg CDI에서 되찾은 위상은 나노 결정 안의 격자 변위를 보여 줍니다. | coherent 회절에서 검출기에 남는 것은 원거리 장의 세기뿐입니다. QoraPhase는 JAX로 만든 CDI·Bragg CDI 위상 복원 프레임워크입니다. 이 세기만으로 복소 물체를 되찾습니다. 영상은 무작위 시작 4개 가운데 서로 가장 잘 맞는 결과이고, support도 데이터에서 찾았습니다. Bragg CDI에서는 되찾은 위상이 나노 결정 안의 격자 변위를 보여 줍니다. |
| Try it on the Fourier bench in the lab | 랩의 푸리에 벤치에서 직접 해 보기 | 푸리에 벤치에서 직접 해 보기 |
| A film writes its thickness into fringes. | 박막은 두께를 무늬로 남깁니다. | 박막 두께는 무늬 간격에 드러납니다. |
| A thin film writes its thickness into the X-ray reflectivity as Kiessig fringes, Δq ≈ 2π/t, and its interface roughness into how fast the curve falls away. Reading the film back out of a measured curve is the inverse problem ReflectoLearn and its predecessor XRefine hand to a neural network. Here XRefine learns, then refines its own guess into a fit. | 박막의 X선 반사율에는 두께가 Kiessig 무늬로(Δq ≈ 2π/t), 계면 거칠기가 곡선이 떨어지는 속도로 남습니다. 측정된 곡선에서 거꾸로 박막을 읽어내는 역문제를 신경망에 맡긴 것이 ReflectoLearn과 그 전신 XRefine입니다. 왼쪽은 XRefine이 실제로 학습하고, 그 추정에서 피팅을 마무리하는 과정입니다. | 박막의 X선 반사율 곡선에는 Kiessig 무늬가 생깁니다. 무늬 간격으로 두께를(Δq ≈ 2π/t), 곡선이 떨어지는 속도로 계면 거칠기를 알 수 있습니다. 측정한 곡선에서 거꾸로 박막을 찾는 이 역문제를 신경망에 맡긴 것이 ReflectoLearn과 그 전신인 XRefine입니다. 영상은 XRefine이 학습한 뒤, 자기 추정값에서 피팅을 마무리하는 과정입니다. |
| Recorded from a real run of XRefine, the physics-informed network before ReflectoLearn, on a GTX 1060: 266 training epochs (early stopping), then its own staged refinement, differential evolution through the same Abeles model. Grey is one simulated curve with noise; ink is the model curve. The drop below the critical edge is the beam footprint on a short sample. Simulated, not measured. | ReflectoLearn의 전신인 physics-informed 신경망 XRefine을 이 PC(GTX 1060)에서 실제로 돌려 녹화했습니다. 266 epoch 학습(early stopping) 뒤, XRefine의 단계별 refinement가 같은 Abeles 모델로 differential evolution 피팅을 합니다. 회색은 노이즈를 넣은 시뮬레이션 곡선, 검은 선은 모델 곡선입니다. 임계각 아래의 감소는 짧은 시료 위 빔 footprint 때문입니다. 측정 데이터가 아닙니다. | ReflectoLearn의 전신인 physics-informed 신경망 XRefine을 GTX 1060에서 실제로 돌려 녹화했습니다. 266 epoch 학습(early stopping) 뒤, XRefine의 단계별 refinement가 같은 Abeles 모델로 differential evolution 피팅을 합니다. 회색은 노이즈를 넣은 시뮬레이션 곡선, 검은 선은 모델 곡선입니다. 임계각 아래에서 세기가 줄어드는 것은 시료가 짧아 빔 footprint가 넘치기 때문입니다. 측정 데이터가 아닙니다. |
| Lately | 최근 기록 | = |
| All notes | 모든 노트 | = |
| On GitHub | GitHub 활동 | = |
| Upstream pull requests | 업스트림 기여 | 다른 프로젝트에 보낸 PR |
| Submitted pull requests; listing them does not mean they were merged. | 제출한 PR 목록이며 병합 여부를 뜻하지 않습니다. | 제출한 PR입니다. 병합되었다는 뜻은 아닙니다. |
| Excellence Award, 17th Sogang University Startup Audition, December 2025, for Nano Metrology Research: an AI-driven X-ray platform for thin-film and nano-structure analysis. | 2025년 제17회 서강대학교 스타트업 오디션 우수상(2025. 12. 5.). 나노계측연구팀, X선 박막·나노 구조 분석을 AI로 하는 플랫폼. | 제17회 서강대학교 스타트업 오디션 우수상(2025. 12. 5.). 나노계측연구팀의 AI 기반 X선 박막·나노 구조 분석 플랫폼으로 받았습니다. |
| Happy to talk beamtime, inverse problems or open source. | 빔타임, 역문제, 오픈소스 이야기라면 언제든 반갑습니다. | 빔타임, 역문제, 오픈소스에 관해서라면 편하게 연락 주세요. |
| Graduation day, August 2025. The one in the air is me. | 졸업식 날 헹가래. 날고 있는 사람이 저예요. 2025. 8. | 2025년 8월 졸업식 날 헹가래. 공중에 뜬 사람이 저입니다. |
| Where to find me | 어디서 찾나요? | 연락처 |
| Blog | 블로그 | = |
| Seoul, Sogang University | 서울, 서강대학교 | 서울 서강대학교 |
| X-ray physics and scientific software | X선 물리와 과학 소프트웨어 | = |
| Top | 맨 위로 | = |

## lab/index.html

| English | Old Korean | New Korean |
|---|---|---|
| Isaac Yong | 용이삭 | = |
| Work | 작업 | = |
| Tools | 도구 | 계산기 |
| Notes | 노트 | = |
| Touch the wave.See the transform. | 파동을 만지고, / 변환을 보세요. | 직접 만져 보는 / 파동과 푸리에 변환 |
| Two small experiments built on two different models: a time-domain wave you can poke, and a Fourier-optics bench for apertures and filters. Nothing here is precomputed. | 서로 다른 두 모델 위에 만든 작은 실험 두 개입니다. 직접 건드릴 수 있는 시간 영역의 파동, 그리고 조리개와 필터를 다루는 푸리에 광학 벤치. 미리 계산해 둔 것은 없습니다. | 서로 다른 두 모델로 만든 작은 실험 두 개입니다. 하나는 직접 건드리는 시간 영역의 파동이고, 하나는 조리개와 필터를 다루는 푸리에 광학 벤치입니다. 미리 계산해 둔 결과는 없고, 전부 브라우저에서 바로 계산합니다. |
| Ripple tank | 물결 수조 | = |
| A ripple tank for light: a 2D scalar wave equation on an optical table. The slit jaws absorb by default, like the tungsten blades of an X-ray slit; switch them to reflecting to see the standing waves an ideal mirror sends back. Click to ripple. Double-click to pin a source, double-click it again to remove it. Drag the barrier by its mount on the rail, a slit up or down by its opening, or a jaw's knife edge to change the gap. With the lattice in place, drag its middle to move it and its rim to rotate it, and watch for the angle where the detector lights up: that is the Bragg condition. At the right edge a film strip darkens where intensity arrives; click it for fresh film. Beside it, the thin line is the intensity arriving now and the heavy one its running average. | 빛을 위한 물결 수조, 광학 테이블 위의 2D 스칼라 파동 방정식입니다. 슬릿 날은 기본적으로 X선 슬릿의 텅스텐 날처럼 흡수하고, 반사로 바꾸면 이상적인 거울이 되돌려 보내는 정상파가 보입니다. 클릭하면 물결, 더블클릭하면 광원을 고정하고 다시 더블클릭하면 지웁니다. 레일 위 마운트를 끌면 차단벽이, 열린 곳을 끌면 슬릿이 위아래로, 날 끝을 끌면 틈이 바뀝니다. 격자를 놓으면 가운데를 끌어 옮기고 테두리를 끌어 돌리면서, 검출기가 밝아지는 각도를 찾아보세요. 그게 Bragg 조건입니다. 오른쪽 끝 필름은 세기가 닿는 곳이 어두워지고, 클릭하면 새 필름으로 바뀝니다. 그 옆 얇은 선은 지금 도착하는 세기, 굵은 선은 그 이동 평균입니다. | 빛을 위한 물결 수조입니다. 광학 테이블 위에서 2D 스칼라 파동 방정식을 풉니다. 슬릿 날은 처음에 X선 슬릿의 텅스텐 날처럼 빛을 흡수합니다. 반사로 바꾸면 이상적인 거울이 되돌려 보낸 정상파가 보입니다. 클릭하면 물결이 생깁니다. 더블클릭하면 그 자리에 광원이 고정되고, 한 번 더 더블클릭하면 사라집니다. 차단벽은 레일 위 마운트를, 슬릿은 열린 곳을 잡고 위아래로 끕니다. 날 끝을 끌면 틈 너비가 바뀝니다. 격자를 놓았다면 가운데를 끌어 옮기고 테두리를 끌어 돌려 보세요. 검출기가 밝아지는 각도가 Bragg 조건입니다. 오른쪽 끝 필름은 빛이 닿은 곳이 검게 변하고, 클릭하면 새 필름으로 바뀝니다. 그 옆의 가는 선은 지금 도착하는 세기, 굵은 선은 그 이동 평균입니다. |
| 1 source | 광원 1개 | = |
| 2 sources | 광원 2개 | = |
| No sample | 시료 없음 | = |
| Lattice | 격자 | = |
| Double slit | 이중 슬릿 | = |
| Single slit | 단일 슬릿 | = |
| Open | 열림 | = |
| Absorbing jaws | 흡수하는 날 | = |
| Reflecting jaws | 반사하는 날 | = |
| Wavelength | 파장 | = |
| Slit width | 슬릿 폭 | = |
| Fourier bench | 푸리에 벤치 | = |
| A separate model: a monochromatic complex field and its 2D Fourier transform, not a time-domain wave. Pick an aperture or draw one, block frequencies in the far field in the middle, and on the right see what survives when the phase is thrown away. | 별개의 모델입니다. 시간 영역의 파동이 아니라 단색 복소 장과 그 2D 푸리에 변환입니다. 조리개를 고르거나 직접 그리고, 가운데 원거리 패턴에서 주파수를 막아 보고, 오른쪽에서 위상을 버리면 무엇이 남는지 보세요. | 앞의 수조와는 다른 모델입니다. 시간에 따라 움직이는 파동이 아니라 단색 복소 장과 그 2D 푸리에 변환을 다룹니다. 조리개를 고르거나 직접 그려 보세요. 가운데 원거리 패턴에서는 주파수를 막을 수 있고, 오른쪽에서는 위상을 버렸을 때 무엇이 남는지 볼 수 있습니다. |
| Circle | 원 | = |
| Ring | 고리 | = |
| Slit | 슬릿 | = |
| Square | 정사각형 | = |
| Grating | 격자 무늬 | = |
| Hole lattice | 구멍 격자 | = |
| Random holes | 무작위 구멍 | = |
| Letter λ | 글자 λ | = |
| Draw | 직접 그리기 | = |
| Size | 크기 | = |
| Spacing | 간격 | = |
| Brush | 붓 | = |
| Eraser | 지우개 | = |
| Clear | 비우기 | = |
| No filter | 필터 없음 | = |
| Low-pass | 저역 통과 | = |
| High-pass | 고역 통과 | = |
| Paint stops | 직접 막기 | = |
| Cutoff | 차단 주파수 | = |
| Clear stops | 막은 곳 지우기 | = |
| Filtered image | 필터 거친 상 | = |
| Phase discarded | 위상 버림 | = |
| Phase only | 위상만 | = |
| How it works | 어떻게 동작하나 | 작동 원리 |
| X-ray reflectivity | X선 반사율 | = |
| A third model: specular reflection of X-rays from a thin film at grazing angles. Below the critical edge everything is reflected; above it, the waves reflected at the film's top and bottom interfere into Kiessig fringes. The fringe spacing gives the thickness, the edge the density (SLD), and how fast the fringes die away the roughness. Change the film and watch the curve move. | 세 번째 모델은 X선이 얇은 막에 아주 낮은 각으로 닿을 때의 정반사입니다. 임계각 아래에서는 전부 반사되고, 그 위에서는 막 윗면과 아랫면에서 반사된 빛이 간섭해 Kiessig 무늬를 만듭니다. 무늬 간격은 두께를, 임계각은 밀도(SLD)를, 무늬가 꺼지는 속도는 거칠기를 알려 줍니다. 막을 바꾸면서 곡선이 어떻게 움직이는지 보세요. | 세 번째 모델은 얇은 막에 아주 낮은 각도로 닿은 X선의 정반사입니다. 임계각 아래에서는 전부 반사됩니다. 그 위에서는 막의 윗면과 아랫면에서 반사된 빛이 간섭해 Kiessig 무늬를 만듭니다. 무늬 간격은 두께를, 임계각은 밀도(SLD)를, 무늬가 사라지는 속도는 거칠기를 알려 줍니다. 막을 바꾸면서 곡선이 어떻게 움직이는지 보세요. |
| Thickness | 두께 | = |
| Roughness | 거칠기 | = |
| Film SLD (10⁻⁶/Å²) | 막 SLD (10⁻⁶/Å²) | = |
| Si substrate | Si 기판 | = |
| Glass substrate | 유리 기판 | = |
| Ideal curve | 이상적 곡선 | = |
| Counting noise | 계수 잡음 | = |
| New noise | 잡음 다시 뽑기 | = |
| Estimate with the CNN | CNN으로 추정 | = |
| Isaac Yong, the lab | 용이삭, 랩 | 용이삭의 실험 페이지 |
| Home | 홈 | = |

## tools/index.html

| English | Old Korean | New Korean |
|---|---|---|
| Isaac Yong | 용이삭 | = |
| Home | 홈 | = |
| Work | 작업 | = |
| Lab | 랩 | 실험 |
| Notes | 노트 | = |
| X-ray calculator. | X선 계산기. | X선 계산기 |
| Set the beam energy once and every calculator below follows it. Results update as you type; tap a result to copy it. The full offline set, with a beamtime logbook, is at xray.ooguy.com. | 빔 에너지를 한 번 정하면 아래 계산이 모두 따라갑니다. 입력하는 즉시 다시 계산하고, 결과 숫자를 누르면 복사됩니다. 오프라인 전체판과 빔타임 로그북은 xray.ooguy.com에 있습니다. | 빔 에너지를 한 번 정하면 아래 계산기가 모두 그 값을 씁니다. 입력하는 대로 바로 계산하고, 결과 숫자를 누르면 복사됩니다. 빔타임 기록장까지 들어 있는 오프라인 전체판은 xray.ooguy.com에 있습니다. |
| Beam | 빔 | = |
| Energy | 에너지 | = |
| Wavelength | 파장 | = |
| Bragg angle, q and d-spacing | 브래그 각, q, d-간격 | = |
| Type any one of the three; the others follow. Change the energy and d stays put while 2θ moves. | 셋 중 아무거나 입력하면 나머지가 맞춰집니다. 에너지를 바꾸면 d는 그대로, 2θ가 움직입니다. | 셋 중 하나를 입력하면 나머지가 따라옵니다. 에너지를 바꾸면 d는 그대로 두고 2θ가 바뀝니다. |
| λ = 2d sin θ and q = 4π sin θ / λ = 2π / d. For reflectivity, θ is the grazing angle and q = qz. | λ = 2d sin θ, q = 4π sin θ / λ = 2π / d. 반사율 측정에서는 θ가 스침각이고 q = qz입니다. | = |
| Beam footprint | 빔 풋프린트 | = |
| Check whether the beam spills past the sample at low angle. | 낮은 각도에서 빔이 시료 밖으로 넘치는지 확인합니다. | = |
| Beam height | 빔 높이 | = |
| Incidence α | 입사각 α | = |
| Sample length | 시료 길이 | = |
| L = h / sin α. Below the angle where sin α = h / sample length, part of the beam misses the sample and the measured intensity drops. The sketch keeps the lengths to scale, not the angle. | L = h / sin α. sin α = h / 시료 길이가 되는 각도보다 낮으면 빔 일부가 시료를 비켜 가고 측정 세기가 줄어듭니다. 그림은 길이 비율만 맞추고 각도는 과장했습니다. | = |
| Transmission | 투과율 | = |
| How much beam gets through a filter, a window or the sample. | 필터, 창, 시료를 지나고 남는 빔의 비율. | 필터, 창, 시료를 지난 뒤 남는 빔의 비율을 구합니다. |
| Thickness | 두께 | = |
| Attenuation length | 감쇠 길이 | = |
| T = exp(−t / ℓ). Look the attenuation length up for your material and energy in the CXRO tables. | T = exp(−t / ℓ). 감쇠 길이는 물질과 에너지에 맞게 CXRO 표에서 찾을 수 있습니다. | = |
| Crystallite size (Scherrer) | 셰러 결정 크기 | = |
| Estimate crystallite size from the width of a diffraction peak. | 회절 피크의 폭으로 결정 크기를 어림합니다. | = |
| Peak 2θ | 피크 2θ | = |
| FWHM β | 반치폭 β | = |
| Shape factor K | 형상 인자 K | = |
| τ = K λ / (β cos θ), with β in radians. Subtract the instrument width first; strain broadening makes the size come out too small. | τ = K λ / (β cos θ), β는 라디안. 장비 폭을 먼저 빼세요. 변형에 의한 폭이 섞이면 실제보다 작게 나옵니다. | = |
| Bravais lattice and d-spacing | 브라베 격자와 d-간격 | = |
| Pick the crystal system and centring, then the cell and hkl. Reflections the centring forbids are flagged. | 결정계와 중심화를 고르고 격자 상수와 hkl을 넣으세요. 중심화 때문에 사라지는 반사는 따로 알려 줍니다. | = |
| First allowed reflections (tap to use) | 처음 나오는 반사 (누르면 hkl로) | 허용되는 첫 반사(누르면 hkl에 입력) |
| 1/d² = h·G*·h, the general triclinic form, used for every lattice. Extinctions here come from the lattice centring only (I: h+k+l odd; F: mixed parity; C: h+k odd; R: −h+k+l ≠ 3n, hexagonal axes). Screw axes, glide planes and zero structure factors are not checked: diamond Si (200) is allowed by F but is zero in practice. | 1/d² = h·G*·h, 삼사정계 일반식을 모든 격자에 그대로 씁니다. 소멸 규칙은 격자 중심화만 봅니다(I: h+k+l 홀수, F: 홀짝 섞임, C: h+k 홀수, R: −h+k+l ≠ 3n, 육방 축). 공간군의 나사축·미끄럼면 소멸과 구조 인자 0은 따지지 않습니다. 예: 다이아몬드 Si (200)은 F로는 허용이지만 실제로는 0입니다. | = |
| Copy a link with these values | 이 값들로 링크 복사 | = |
| Isaac Yong, beamline tools | 용이삭, 빔라인 도구 | 용이삭의 빔라인 계산기 |

## notes/index.html

| English | Old Korean | New Korean |
|---|---|---|
| Working notes | 작업 노트 | = |
| Short write-ups from experiments, code and reading. Unpolished on purpose. There is an RSS feed. | 실험, 코드, 읽은 것에서 나온 짧은 글입니다. 일부러 다듬지 않았습니다. 글은 영어로 씁니다. RSS 피드도 있습니다. | 실험과 코드, 읽은 글에서 나온 짧은 메모입니다. 일부러 다듬지 않고 올립니다. 글은 영어로 씁니다. RSS 피드로도 볼 수 있습니다. |
| Nothing here yet. | 아직 글이 없습니다. | = |

## 404.html

| English | Old Korean | New Korean |
|---|---|---|
| This wave didn't arrive. | 이 파동은 도착하지 않았습니다. | 찾는 페이지가 없습니다. |
| The page you asked for isn't here. Try the home page, the X-ray calculator, the notes or the lab. | 찾는 페이지가 없습니다. 홈, X선 계산기, 노트, 랩으로 가 보세요. | 주소가 바뀌었거나 없는 페이지입니다. 홈, X선 계산기, 노트, 실험 페이지로 가 보세요. |

## _layouts/base.html

| English | Old Korean | New Korean |
|---|---|---|
| Isaac Yong | 용이삭 | = |
| Work | 작업 | = |
| Notes | 노트 | = |
| Lab | 랩 | 실험 |
| Tools | 도구 | 계산기 |
| Isaac Yong, working notes | 용이삭, 작업 노트 | 용이삭의 작업 노트 |
| Home | 홈 | = |

## lab/lab.js (canvas captions)

| English | Old Korean | New Korean |
|---|---|---|
| Far field (log): paint to block, hover to read | 원거리 세기(로그): 칠해서 막기, 올려서 읽기 | 원거리 세기(로그): 칠하면 막고, 마우스를 올리면 값 표시 |
| Far field (log): drag to set a cutoff, hover to read | 원거리 세기(로그): 끌어서 차단, 올려서 읽기 | 원거리 세기(로그): 끌어서 차단, 마우스를 올리면 값 표시 |
