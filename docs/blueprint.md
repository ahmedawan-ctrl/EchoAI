# **App Name**: EchoAI

## Core Features:

- Image Upload: Allow users to upload ultrasound images directly into the application for analysis.
- Anomaly Detection: Use a pre-trained CNN model (like YOLOv8 or Faster R-CNN) to automatically detect and highlight potential abnormalities in the ultrasound image. Tool uses reasoning to decide whether an identified piece of the ultrasound matches an known medical condidion.
- Report Generation: Generate a preliminary report based on the detected anomalies using a Transformer-based language model.
- VQA Chatbot: Implement a VQA feature allowing users to ask questions about the ultrasound image and receive AI-generated answers based on the image content.
- Dual Image Display: Present the original ultrasound image and the AI-annotated image side-by-side for easy comparison.
- Report Editor: Provide a text box where the AI-generated report can be reviewed, edited, and finalized by the user.

## Style Guidelines:

- Primary color: A deep teal (#328393) to evoke a sense of trust, calmness, and clinical precision.
- Background color: A very light, desaturated teal (#F0F8FA) to provide a clean, neutral backdrop that is easy on the eyes.
- Accent color: A muted gold (#B5A642), used sparingly for highlights, important notifications, or call-to-action buttons.
- Headline font: 'Space Grotesk' (sans-serif) for a modern, clean and technical aesthetic.
- Body font: 'Inter' (sans-serif) for readability and a neutral appearance that pairs well with 'Space Grotesk'.
- Use a set of minimalist icons to represent different functions and abnormalities within the application. The style should be consistent and clean.
- Employ a clean, two-panel layout with the original ultrasound image on one side and AI-annotated version alongside, ensuring efficient user workflows.