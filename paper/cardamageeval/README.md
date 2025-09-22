# Enhancing Brain Tumor Classification with SSPANet

This repository contains the official implementation of the paper:  
**"Enhancing brain tumor classification with a novel attention-based explainable deep learning framework"**  
Published in *Biomedical Signal Processing and Control*, Elsevier, 2026.  
DOI: [10.1016/j.bspc.2025.108636](https://doi.org/10.1016/j.bspc.2025.108636)

---

## Overview
Accurate and early detection of brain tumors from MRI scans is critical for patient outcomes, yet most deep learning (DL) models act as black boxes with limited clinical trust. To address this, we propose the **Strip-Style Pooling Attention Network (SSPANet)** — a lightweight, explainable attention mechanism that enhances both classification accuracy and interpretability in brain tumor diagnosis.

SSPANet combines **Z-pool channel attention**, **strip pooling for long-range spatial context**, and **style pooling for fine-grained texture awareness**. Integrated with CNN backbones (VGG16 and ResNet50), it delivers state-of-the-art results while producing clear visual explanations through **GradCAM, GradCAM++, and EigenGradCAM**.

---

