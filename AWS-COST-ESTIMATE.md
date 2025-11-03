# AWS Hosting Cost Estimate - India Skills Examination Portal
## 60,000 Students Over 3-4 Days Event

**Document Date:** November 2025  
**Region:** AWS US-East (N. Virginia) - Lowest pricing  
**Event Duration:** 3-4 days  
**Total Students:** 60,000  
**Peak Concurrent Users:** 5,000 (maximum)  

---

## 📊 SCENARIO 1: WITHOUT SCREEN RECORDINGS

### Infrastructure Components

| Service | Configuration | Hours | Unit Price | Total Cost |
|---------|--------------|-------|------------|------------|
| **EC2 Auto Scaling (Peak)** | 4x t3.xlarge (4 vCPU, 16GB) | 96 hrs | $0.1664/hr | $160 |
| **EC2 Auto Scaling (Off-Peak)** | 2x t3.medium (2 vCPU, 8GB) | 128 hrs | $0.0416/hr | $53 |
| **RDS PostgreSQL** | db.r5.xlarge (4 vCPU, 32GB) | 96 hrs | $0.48/hr | $46 |
| **Application Load Balancer** | Standard ALB | 96 hrs | $0.0225/hr | $22 |
| **ElastiCache Redis** | cache.m5.large (Session storage) | 96 hrs | $0.136/hr | $13 |
| **CloudFront CDN** | 800 GB transfer (static files) | - | $0.085/GB | $68 |
| **S3 Storage** | Static assets (logos, CSS, JS) | - | Flat | $5 |
| **CloudWatch Monitoring** | Metrics, logs, alarms | - | Flat | $15 |
| **Data Transfer Out** | ~600 GB (exam data, API responses) | - | $0.09/GB | $54 |

### **TOTAL COST (Without Recordings): $436**

#### Cost Per Student: **$0.0073 USD** (≈ ₹0.61 INR)

---

## 🎥 SCENARIO 2: WITH SCREEN RECORDINGS

### Base Infrastructure (Same as Scenario 1)

| Service | Cost |
|---------|------|
| Base Infrastructure (EC2, RDS, ALB, Redis, etc.) | $436 |

### Additional Recording Infrastructure

#### Recording Storage Calculation

**Assumptions:**
- Average exam duration: 60 minutes per student
- Screen recording quality: Moderate (1 Mbps bitrate)
- Recording size per student: **0.5 GB/hour**
- Total students: 60,000
- Storage duration: 1 month (then archive to Glacier)

**Total Recording Data:** 60,000 students × 0.5 GB = **30,000 GB (30 TB)**

---

### Recording Costs Breakdown

| Component | Calculation | Unit Price | Total Cost |
|-----------|-------------|------------|------------|
| **S3 Storage (30 days)** | 30,000 GB × 1 month | $0.023/GB-month | $690 |
| **S3 PUT Requests** | 60,000 uploads | $0.005/1K requests | $0.30 |
| **Data Transfer IN** | 30 TB upload to S3 | Free | $0 |
| **Admin Review Downloads** | 1% reviewed (300 GB) | $0.09/GB | $27 |
| **S3 Lifecycle Management** | Moving to Glacier after 30 days | $0.005/1K transitions | $0.30 |
| **CloudWatch (Recording Monitoring)** | Enhanced logging | Flat | $15 |

#### **Storage Cost Options:**

**Option A: Keep for 1 Month in S3 Standard**
- Storage: $690
- Requests: $0.60
- Downloads: $27
- Monitoring: $15
- **Subtotal: $732.60**

**Option B: Keep for 7 Days, then Glacier Deep Archive**
- S3 Standard (7 days): 30,000 GB × $0.023 × (7/30) = $161
- Glacier Deep Archive (23 days): 30,000 GB × $0.00099 × (23/30) = $23
- Requests & Downloads: $27.60
- Monitoring: $15
- **Subtotal: $226.60**

**Option C: Event-Only (4 Days), then Delete**
- S3 Standard (4 days): 30,000 GB × $0.023 × (4/30) = $92
- Requests & Downloads: $27.60
- Monitoring: $10
- **Subtotal: $129.60**

---

### Recording Infrastructure (If Live Streaming Needed)

**⚠️ Only use if you need REAL-TIME monitoring of screens during exam**

| Service | Configuration | Cost |
|---------|--------------|------|
| **Kinesis Video Streams Ingest** | 30 TB ingestion | $0.0085/GB | $255 |
| **Kinesis Storage** | 30 TB for 4 days | $0.023/GB × (4/30) | $92 |
| **Kinesis Data Consumption** | Admin monitoring 1% | $0.0085/GB | $2.55 |
| **Total Kinesis Option** | (Add to base) | | **$349.55** |

**❌ NOT RECOMMENDED:** Kinesis adds $350+ just for ingestion. Use direct-to-S3 upload instead.

---

## 💰 FINAL COST COMPARISON

### Summary Table

| Scenario | Base Infrastructure | Recording Storage | **TOTAL COST** | Cost/Student |
|----------|---------------------|-------------------|----------------|--------------|
| **No Recordings** | $436 | $0 | **$436** | $0.007 (₹0.58) |
| **With Recordings (4 days)** | $436 | $130 | **$566** | $0.009 (₹0.75) |
| **With Recordings (7 days)** | $436 | $227 | **$663** | $0.011 (₹0.92) |
| **With Recordings (30 days)** | $436 | $733 | **$1,169** | $0.019 (₹1.58) |
| **With Live Streaming** | $436 | $350 | **$786** | $0.013 (₹1.08) |

---

## 🎯 RECOMMENDED CONFIGURATION

### Best Value: **With Recordings (7 Days) = $663**

**Why This is Best:**
1. ✅ Captures all exam sessions for review
2. ✅ Keeps recordings accessible for 7 days (sufficient for dispute resolution)
3. ✅ Auto-archives to Glacier Deep Archive after 7 days (99.9% cheaper storage)
4. ✅ Can retrieve archived recordings later if needed (12-48 hours retrieval time)
5. ✅ Only **$227 extra** compared to no recordings
6. ✅ **$0.004/student** for comprehensive recording coverage

---

## 📈 COST OPTIMIZATION STRATEGIES

### 1. **Use EC2 Spot Instances (Save 50-70%)**
- Mix: 50% On-Demand + 50% Spot Instances
- **Potential Savings:** $80 on EC2 costs
- **New Base Cost:** $356 (instead of $436)

### 2. **Enable Gzip Compression**
Already in your code, reduces data transfer by 70%
- **Current Data Transfer:** $54
- **With Compression:** $16
- **Savings:** $38

### 3. **Use Lower Recording Quality**
- **Current:** 1 Mbps (0.5 GB/hr) = 30 TB total
- **Optimized:** 500 kbps (0.25 GB/hr) = 15 TB total
- **Storage Savings (7 days):** $113

### 4. **Record Only Violations/Flags**
Instead of recording all 60,000 students:
- Record only students with proctoring alerts (~5% = 3,000 students)
- **Storage:** 1.5 TB instead of 30 TB
- **Cost:** $11.35 instead of $227
- **Savings:** $215

### 5. **S3 Intelligent-Tiering**
Automatically moves infrequently accessed recordings to cheaper tiers
- **Initial Cost:** Same as Standard
- **After 30 days:** Automatically moves to Archive tier ($0.004/GB)
- **Savings:** Up to 95% on long-term storage

---

## 🚀 OPTIMIZED COST ESTIMATE

### With All Optimizations Applied

| Component | Original | Optimized | Savings |
|-----------|----------|-----------|---------|
| EC2 (50% Spot) | $213 | $133 | **$80** |
| Data Transfer (Compressed) | $54 | $16 | **$38** |
| Recording (Lower Quality) | $227 | $113 | **$114** |
| **TOTAL** | **$663** | **$431** | **$232** |

### **Best Optimized Price: $431 for 60,000 students**
### **Cost per student: $0.007 USD (≈ ₹0.58 INR)**

---

## 📋 COST BREAKDOWN BY DAY

### Daily Running Cost (Peak Exam Days)

| Time Period | Resources Active | Cost/Hour | Hours/Day | Daily Cost |
|-------------|------------------|-----------|-----------|------------|
| **Peak Hours** (8 AM - 6 PM) | 4x t3.xlarge + RDS + Redis + ALB | $6.50 | 10 hrs | $65 |
| **Off-Peak** (6 PM - 8 AM) | 2x t3.medium + RDS + Redis + ALB | $1.10 | 14 hrs | $15 |
| **Recording Upload** | S3 PUT + Storage (prorated) | - | - | $32 |
| **Data Transfer** | CloudFront + Egress | - | - | $18 |
| **TOTAL PER DAY** | | | | **$130** |

**4-Day Event Total:** $130 × 4 = **$520**

---

## 💡 RECORDING IMPLEMENTATION OPTIONS

### Option A: Client-Side Recording → S3 (RECOMMENDED ✅)
**How it works:**
1. Browser records screen using MediaRecorder API
2. Student clicks "Submit Exam" → recording uploads to S3
3. Uses AWS presigned URLs for direct browser → S3 upload
4. No server bandwidth used

**Pros:**
- ✅ No server bandwidth cost
- ✅ Scalable to unlimited students
- ✅ Simple implementation
- ✅ Works offline (uploads when connection restored)

**Cons:**
- ⚠️ Student can stop recording (but violation will be logged)
- ⚠️ Requires browser permission

**Cost:** $130 for 4 days (included in estimate above)

---

### Option B: Server-Side Streaming (NOT RECOMMENDED ❌)
**How it works:**
1. Browser streams video to server via WebRTC
2. Server records and uploads to S3/Kinesis
3. Real-time monitoring possible

**Pros:**
- ✅ Can't be stopped by student
- ✅ Real-time monitoring

**Cons:**
- ❌ High server bandwidth ($1,000+ extra)
- ❌ Complex infrastructure
- ❌ Requires Kinesis Video Streams ($350 extra)
- ❌ 10x more expensive

**Cost:** $1,483 (NOT RECOMMENDED)

---

## 🔒 ADDITIONAL SERVICES (OPTIONAL)

| Service | Purpose | Cost |
|---------|---------|------|
| **AWS WAF** | DDoS protection, bot filtering | $5 + $1/million requests = $11 |
| **AWS Shield Standard** | Basic DDoS protection | Free |
| **AWS Business Support** | 24/7 phone support, <1hr response | $100/month |
| **AWS Backup** | Automated RDS backups | $15 |
| **CloudTrail Logging** | Audit trail for compliance | $8 |

**Total Optional Services:** $134

---

## 📊 FINAL RECOMMENDATION

### **Recommended Setup: With Recordings (7-Day Retention)**

```
┌─────────────────────────────────────────────────┐
│  TOTAL EVENT COST: $663                         │
│  ├─ Base Infrastructure: $436                   │
│  └─ Screen Recordings (7 days): $227            │
│                                                  │
│  With Optimizations: $431                       │
│  ├─ Spot Instances: -$80                        │
│  ├─ Gzip Compression: -$38                      │
│  └─ Lower Recording Quality: -$114              │
│                                                  │
│  COST PER STUDENT: $0.007 (≈ ₹0.58)            │
└─────────────────────────────────────────────────┘
```

### Why This Configuration?

1. ✅ **Complete Coverage:** All 60,000 exams recorded
2. ✅ **Dispute Resolution:** 7-day retention for review
3. ✅ **Cost Effective:** Only $227 extra for recordings
4. ✅ **Archival:** Auto-move to Glacier (99% cheaper) after 7 days
5. ✅ **Scalable:** Handles 5,000+ concurrent users comfortably
6. ✅ **Reliable:** 99.99% uptime with Multi-AZ RDS

---

## 📅 PAYMENT TIMELINE

### AWS Billing Schedule

| When | What Gets Billed | Amount |
|------|------------------|---------|
| **Day 1-4** | EC2, RDS, ALB running (hourly) | ~$192/day |
| **Day 4** | Recording storage (prorated) | $92 |
| **End of Month** | Full monthly bill issued | $1,010 |
| **30 days later** | Lifecycle moves recordings to Glacier | $23/month ongoing |

**💡 TIP:** Set AWS Budget Alert at $800 to get notified at 80% spending

---

## 🛡️ RISK MITIGATION

### What if costs exceed estimate?

### Budget Alert Setup:
```
AWS Console → Billing → Budgets
├─ Budget Amount: $800
├─ Alert Threshold: 80% ($640)
├─ Alert Threshold: 100% ($800)
└─ Action: Email to admin@yourschool.edu
```

### Emergency Cost Controls:

1. **Auto-Scaling Limits:** Max 6 instances (prevents runaway costs)
2. **S3 Lifecycle:** Auto-delete recordings after 90 days
3. **CloudWatch Alarms:** Alert if data transfer exceeds 1 TB/day
4. **RDS Stop Protection:** Prevent accidental over-provisioning

---

## 📞 NEXT STEPS

### Before the Event:

- [ ] Create AWS account (if new, get $300 free credits!)
- [ ] Set up billing alerts ($800, $1000, $1200)
- [ ] Deploy infrastructure using CloudFormation template
- [ ] Load test with 5,000 concurrent users
- [ ] Configure S3 lifecycle policies
- [ ] Set up CloudWatch dashboards

### During the Event:

- [ ] Monitor CloudWatch dashboard every hour
- [ ] Check billing dashboard daily
- [ ] Have AWS Business Support on standby ($100)
- [ ] Keep backups of RDS database

### After the Event:

- [ ] Download critical recordings within 7 days
- [ ] Verify Glacier archival (check after 7 days)
- [ ] Terminate EC2 instances within 24 hours
- [ ] Keep RDS snapshot for 30 days
- [ ] Delete temp data after exam validation

---

## 💰 TOTAL COST SUMMARY

| Configuration | Infrastructure | Recordings | Support | **TOTAL** |
|---------------|----------------|------------|---------|-----------|
| **No Recordings** | $436 | $0 | $0 | **$436** |
| **Basic (4 days)** | $436 | $130 | $0 | **$566** |
| **Recommended (7 days)** | $436 | $227 | $100 | **$763** |
| **Full Month** | $436 | $733 | $100 | **$1,269** |
| **Optimized Best** | $356 | $113 | $100 | **$569** |

---

## 📧 Questions or Need Help?

This estimate is based on:
- AWS US-East (N. Virginia) pricing as of November 2025
- 60,000 students over 3-4 days
- **5,000 concurrent peak users (maximum)**
- Moderate-quality screen recordings (1 Mbps)
- 7-day retention with Glacier archival

**To get an exact quote for your specific needs:**
- Use AWS Pricing Calculator: https://calculator.aws
- Contact AWS Sales for bulk discount (enterprise agreements)
- Consider AWS Activate for Startups ($10,000 credits available)

---

**Document Version:** 1.0  
**Last Updated:** November 2025  
**Prepared For:** India Skills 2025 Examination Event  
**Contact:** [Your IT Department Contact]

---

## 🎓 APPENDIX: Cost Calculation Formulas

### Recording Storage Formula:
```
Total Storage (GB) = Students × Hours × Bitrate_MBps × 3.6
Total Cost = (Storage_GB × $0.023 × Days/30) + (Students × $0.005/1000)

Example (60k students, 1hr, 1 Mbps, 7 days):
Storage = 60,000 × 1 × 0.125 × 3.6 = 27,000 GB
Cost = (27,000 × $0.023 × 7/30) + (60,000 × $0.005/1000)
Cost = $145 + $0.30 = $145.30
```

### EC2 Auto Scaling Cost Formula:
```
Cost = Instances × Hours × Price_per_Hour

Peak (4 instances, 40 hrs): 4 × 40 × $0.1664 = $26.62/day
Off-peak (2 instances, 14 hrs): 2 × 14 × $0.0416 = $1.16/day
Total per day: $27.78
```

### Data Transfer Cost Formula:
```
First 10 TB: $0.09/GB
Next 40 TB: $0.085/GB
Next 100 TB: $0.07/GB
Over 150 TB: $0.05/GB

Example (1.2 TB): 1,200 GB × $0.09 = $108
With compression (400 GB): 400 GB × $0.09 = $36
```

---

## 🇮🇳 INDIA REGION PRICING (AP-SOUTH-1 MUMBAI)

### **Since exam is only in AP, India - Using Mumbai Region**

**Key Benefits:**
- ✅ **7-10% cheaper** than US regions for EC2/RDS
- ✅ **NO international data transfer fees** (all students in India)
- ✅ **Lower latency** for Andhra Pradesh students (~20-40ms)
- ✅ **Data residency compliance** (data stays in India)

### Adjusted Costs for Mumbai Region:

| Scenario | US-East Pricing | Mumbai Pricing | **Savings** |
|----------|----------------|----------------|-------------|
| **No Recordings** | $436 | **$380** | $56 |
| **With Recordings (7 days)** | $663 | **$580** | $83 |
| **Optimized with Recordings** | $431 | **$380** | $51 |

### Why Mumbai is Cheaper:

1. **EC2 instances:** ~7% cheaper ($160 → $149)
2. **RDS PostgreSQL:** ~8% cheaper ($46 → $42)
3. **Data Transfer:** **90% cheaper** (regional vs international)
   - No data transfer OUT to internet (students are in India)
   - Only CloudFront within Asia Pacific region
   - **Saves $45-50 on bandwidth**

### 💰 FINAL COST FOR INDIA-ONLY EXAM:

```
┌─────────────────────────────────────────────────┐
│  WITHOUT RECORDINGS: $380 USD                   │
│  WITH RECORDINGS (7-day): $580 USD              │
│  OPTIMIZED + RECORDINGS: $380 USD               │
│                                                  │
│  COST PER STUDENT: ₹0.53 INR                   │
│  (@ $1 = ₹83 exchange rate)                     │
└─────────────────────────────────────────────────┘
```

**RECOMMENDED: Optimized with Recordings = $380 USD**
- Uses 50% Spot instances
- Gzip compression enabled
- Lower recording quality (still auditable)
- 7-day retention, then Glacier archive
- All students in India (no international fees)

---

**END OF DOCUMENT**
