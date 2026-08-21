# Nabda
> Your health starts with a pulse

Nabda is a comprehensive clinic management system designed to streamline healthcare operations and automate patient documentation. The core of the system is driven by **Pulse**, an integrated AI agent that assists both patients and medical professionals by handling inquiries and generating accurate medical records from consultations.

## Features

### 🧠 Pulse AI Agent
Pulse operates as the central intelligence of the Nabda platform, reducing administrative overhead for doctors and improving patient communication.

*   **FAQ Handling:** Automatically processes and replies to standard patient questions and inquiries.
*   **Consultation Recording:** Utilizes microphone input to securely record the physical conversation between the patient and the doctor.
*   **Intelligent Transcription:** Converts the recorded consultation audio into text. Doctors maintain full control to review and edit the transcribed result for accuracy.
*   **Automated Prescription Extraction:** Analyzes the finalized transcription to extract medications, dosages, and instructions, generating a structured prescription.
*   **Verification & Saving:** Returns the extracted prescription to the doctor for a final review and edit. Upon approval, the data is saved directly to the patient's secure electronic profile.

## System Architecture

*Note: Update this section based on specific deployment configurations.*

*   **Backend:** ASP.NET Core Web API, C#
*   **Database:** SQL Server, Entity Framework (EF) Core
*   **AI Orchestration:** Pulse AI Model 

## Workflow: Automated Documentation

1. **Record:** Doctor initiates Pulse recording during the patient examination.
2. **Transcribe:** Pulse processes the audio and outputs text.
3. **Review:** Doctor edits the raw text transcription if necessary.
4. **Extract:** Doctor clicks "Extract"; Pulse processes the text to isolate prescription data.
5. **Finalize:** Doctor reviews the generated prescription.
6. **Save:** Doctor clicks "Save"; the prescription is attached to the patient profile and the consultation is logged.

## Getting Started

### Prerequisites
*   [.NET 8.0 SDK](https://dotnet.microsoft.com/download) (or current version)
*   [SQL Server](https://www.microsoft.com/en-us/sql-server/sql-server-downloads)
*   Required API keys for the Pulse AI model

### Installation

1. Clone the repository:
   ```bash
   git clone [https://github.com/your-username/nabda.git](https://github.com/your-username/nabda.git)
